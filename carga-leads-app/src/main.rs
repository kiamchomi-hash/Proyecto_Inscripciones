use eframe::egui::{self, Color32};
use serde::Deserialize;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::mpsc::{self, Receiver, Sender};

const FONDO: Color32 = Color32::from_rgb(1, 55, 41);
const TARJETA: Color32 = Color32::from_rgb(28, 47, 49);
const ACENTO: Color32 = Color32::from_rgb(0, 199, 177);
const VERDE: Color32 = Color32::from_rgb(5, 140, 112);
const AZUL: Color32 = Color32::from_rgb(0, 85, 135);
const DORADO: Color32 = Color32::from_rgb(230, 155, 5);
const GRIS: Color32 = Color32::from_rgb(72, 94, 92);
const TEXTO: Color32 = Color32::from_rgb(231, 245, 241);
const ALERTA: Color32 = Color32::from_rgb(255, 138, 128);

#[derive(Clone)]
struct Lead {
    nombre: String,
    apellido: String,
    telefono: String,
    correo: String,
    carrera: Option<String>,
}

impl Lead {
    fn nuevo(nombre: &str, apellido: &str, telefono: &str, correo: &str, carrera: Option<String>) -> Self {
        Self {
            nombre: nombre.into(),
            apellido: apellido.into(),
            telefono: telefono.into(),
            correo: correo.into(),
            carrera,
        }
    }

    fn validar(&self) -> Result<(), String> {
        if self.nombre.trim().is_empty() { return Err("Falta el nombre.".into()); }
        if self.apellido.trim().is_empty() { return Err("Falta el apellido.".into()); }
        if self.correo.trim().is_empty() || !self.correo.contains('@') {
            return Err("El correo no es válido.".into());
        }
        if self.telefono.trim().is_empty() { return Err("Falta el teléfono.".into()); }
        if self.carrera.is_none() { return Err("Elegí una carrera.".into()); }
        Ok(())
    }
}

#[derive(Deserialize, Debug, PartialEq)]
struct EventoCrudo {
    evento: String,
    #[serde(default)]
    texto: Option<String>,
    #[serde(default)]
    etapa: Option<String>,
    #[serde(default)]
    mensaje: Option<String>,
}

#[derive(Debug, PartialEq)]
enum Evento {
    Paso(String),
    Ok,
    Error(String, String),
    SesionCerrada,
}

#[derive(Debug, Default, Clone, Copy, PartialEq)]
enum Sesion {
    #[default]
    Cerrada,
    Abierta,
}

impl Evento {
    fn desde_linea(linea: &str) -> Option<Self> {
        let crudo: EventoCrudo = serde_json::from_str(linea).ok()?;
        match crudo.evento.as_str() {
            "paso" => Some(Self::Paso(crudo.texto.unwrap_or_default())),
            "ok" => Some(Self::Ok),
            "error" => Some(Self::Error(
                crudo.etapa.unwrap_or_default(),
                crudo.mensaje.unwrap_or_else(|| "Error sin detalle.".into()),
            )),
            _ => None,
        }
    }
}

#[derive(Deserialize)]
struct Carrera {
    nombre: String,
    nivel: String,
}

#[derive(Clone, Copy, PartialEq)]
enum Modo {
    Contacto,
    Negocio,
}

#[derive(Default, PartialEq)]
enum Estado {
    #[default]
    Inactivo,
    Cargando,
    Listo,
    Error,
}

struct AppCarga {
    lead: Lead,
    carreras: Vec<(String, String)>,
    filtro: String,
    indice: usize,
    estado: Estado,
    paso: String,
    error: String,
    registro: Vec<String>,
    sesion: Sesion,
    rx: Receiver<Evento>,
    tx: Sender<Evento>,
    estilo_aplicado: bool,
}

impl AppCarga {
    fn nueva(tx: Sender<Evento>, rx: Receiver<Evento>) -> Self {
        let carreras = std::fs::read_to_string(concat!(env!("CARGO_MANIFEST_DIR"), "/carreras.json"))
            .ok()
            .and_then(|texto| serde_json::from_str::<Vec<Carrera>>(&texto).ok())
            .map(|lista| lista.into_iter().map(|c| (c.nombre, c.nivel)).collect())
            .unwrap_or_default();
        Self {
            lead: Lead::nuevo("", "", "", "", None),
            carreras,
            filtro: String::new(),
            indice: 0,
            estado: Estado::Inactivo,
            paso: String::new(),
            error: String::new(),
            registro: Vec::new(),
            sesion: Sesion::Cerrada,
            rx,
            tx,
            estilo_aplicado: false,
        }
    }

    fn registrar(&mut self, evento: Evento) {
        match evento {
            Evento::Paso(texto) => {
                self.paso = texto.clone();
                self.registro.push(texto);
            }
            Evento::Ok => {
                self.estado = Estado::Listo;
                self.paso = "Lead cargado.".into();
                self.registro.push("Lead cargado.".into());
            }
            Evento::Error(etapa, mensaje) => {
                self.estado = Estado::Error;
                self.error = format!("{}: {}", etapa, mensaje);
                self.registro.push(format!("Error: {}", self.error));
            }
            Evento::SesionCerrada => {
                self.sesion = Sesion::Cerrada;
            }
        }
    }

    fn iniciar_sesion(&mut self) {
        self.sesion = Sesion::Abierta;
        self.error.clear();
        let tx = self.tx.clone();
        std::thread::spawn(move || {
            let aux = concat!(env!("CARGO_MANIFEST_DIR"), "/aux/iniciar-sesion.mjs");
            match Command::new("node")
                .arg(aux)
                .stdout(Stdio::null())
                .stderr(Stdio::piped())
                .output()
            {
                Ok(salida) if salida.status.success() => {}
                Ok(salida) => {
                    let mensaje = String::from_utf8_lossy(&salida.stderr).trim().to_string();
                    let mensaje = if mensaje.is_empty() {
                        "No se pudo abrir la ventana de HubSpot.".to_string()
                    } else {
                        mensaje
                    };
                    let _ = tx.send(Evento::Error("sesión".into(), mensaje));
                }
                Err(error) => {
                    let _ = tx.send(Evento::Error("sesión".into(), error.to_string()));
                }
            }
            let _ = tx.send(Evento::SesionCerrada);
        });
    }

    fn cargar(&mut self, modo: Modo, ver: bool) {
        if let Err(mensaje) = self.lead.validar() {
            self.error = mensaje;
            self.estado = Estado::Error;
            return;
        }
        self.estado = Estado::Cargando;
        self.error.clear();
        self.registro.clear();
        let tx = self.tx.clone();
        let lead = self.lead.clone();
        std::thread::spawn(move || {
            let aux = concat!(env!("CARGO_MANIFEST_DIR"), "/aux/cargar.mjs");
            let mut comando = Command::new("node");
            comando.arg(aux);
            match modo {
                Modo::Contacto => { comando.arg("--solo-contacto"); }
                Modo::Negocio => { comando.arg("--solo-negocio"); }
            }
            if ver { comando.arg("--ver"); }
            let mut hijo = match comando
                .stdin(Stdio::piped())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .spawn()
            {
                Ok(hijo) => hijo,
                Err(error) => {
                    let _ = tx.send(Evento::Error("proceso".into(), error.to_string()));
                    return;
                }
            };
            if let Some(entrada) = hijo.stdin.as_mut() {
                use std::io::Write;
                let datos = serde_json::json!({
                    "nombre": lead.nombre,
                    "apellido": lead.apellido,
                    "telefono": lead.telefono,
                    "correo": lead.correo,
                    "carrera": lead.carrera,
                });
                let _ = writeln!(entrada, "{}", datos);
            }
            drop(hijo.stdin.take());
            if let Some(salida) = hijo.stdout.take() {
                for linea in BufReader::new(salida).lines().map_while(Result::ok) {
                    if let Some(evento) = Evento::desde_linea(&linea) {
                        let fin = matches!(evento, Evento::Ok | Evento::Error(_, _));
                        let _ = tx.send(evento);
                        if fin { break; }
                    }
                }
            }
            let _ = hijo.wait();
        });
    }

    fn aplicar_estilo(&mut self, ctx: &egui::Context) {
        if self.estilo_aplicado { return; }
        let mut visuals = egui::Visuals::dark();
        visuals.window_fill = FONDO;
        visuals.panel_fill = FONDO;
        visuals.override_text_color = Some(TEXTO);
        visuals.widgets.inactive.bg_fill = TARJETA;
        visuals.widgets.hovered.bg_fill = Color32::from_rgb(36, 68, 68);
        visuals.widgets.active.bg_fill = ACENTO;
        visuals.selection.bg_fill = Color32::from_rgb(0, 108, 91);
        ctx.set_visuals(visuals);
        self.estilo_aplicado = true;
    }
}

impl eframe::App for AppCarga {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.aplicar_estilo(ctx);
        let eventos: Vec<_> = self.rx.try_iter().collect();
        for evento in eventos {
            self.registrar(evento);
        }
        if self.estado == Estado::Cargando || self.sesion == Sesion::Abierta {
            ctx.request_repaint_after(std::time::Duration::from_millis(300));
        }

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.add(egui::Label::new(
                    egui::RichText::new("Carga de leads").size(24.0).color(ACENTO).strong(),
                ));
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    let (texto, color) = match self.sesion {
                        Sesion::Abierta => ("Cerrá la ventana de HubSpot", GRIS),
                        Sesion::Cerrada => ("Abrir sesión de HubSpot", AZUL),
                    };
                    let boton = egui::Button::new(
                        egui::RichText::new(texto).color(TEXTO).small(),
                    ).fill(color).min_size(egui::vec2(200.0, 30.0));
                    if ui.add_enabled(self.sesion == Sesion::Cerrada, boton).clicked() {
                        self.iniciar_sesion();
                    }
                });
            });
            ui.add_space(10.0);

            egui::Frame::new()
                .fill(TARJETA)
                .inner_margin(egui::Margin::same(14))
                .show(ui, |ui| {
                    ui.add(egui::Label::new(
                        egui::RichText::new("Datos del lead").size(16.0).color(ACENTO).strong(),
                    ));
                    ui.add_space(6.0);
                    ui.horizontal(|ui| {
                        ui.add_sized([96.0, 20.0], egui::Label::new("Nombre"));
                        ui.add(egui::TextEdit::singleline(&mut self.lead.nombre).desired_width(300.0));
                    });
                    ui.horizontal(|ui| {
                        ui.add_sized([96.0, 20.0], egui::Label::new("Apellido"));
                        ui.add(egui::TextEdit::singleline(&mut self.lead.apellido).desired_width(300.0));
                    });
                    ui.horizontal(|ui| {
                        ui.add_sized([96.0, 20.0], egui::Label::new("Teléfono"));
                        ui.add(egui::TextEdit::singleline(&mut self.lead.telefono).desired_width(300.0));
                    });
                    ui.horizontal(|ui| {
                        ui.add_sized([96.0, 20.0], egui::Label::new("Correo"));
                        ui.add(egui::TextEdit::singleline(&mut self.lead.correo).desired_width(300.0));
                    });

                    ui.add_space(12.0);
                    ui.add(egui::Label::new(
                        egui::RichText::new("Carrera").size(16.0).color(ACENTO).strong(),
                    ));
                    ui.add(egui::TextEdit::singleline(&mut self.filtro)
                        .hint_text("Buscar carrera")
                        .desired_width(396.0));
                    egui::ScrollArea::vertical().max_height(180.0).show(ui, |ui| {
                        let filtradas: Vec<_> = self.carreras.iter()
                            .filter(|(nombre, _)| nombre.to_lowercase().contains(&self.filtro.to_lowercase()))
                            .collect();
                        for (indice, (nombre, nivel)) in filtradas.iter().enumerate() {
                            if ui.selectable_label(
                                indice == self.indice,
                                format!("{} · {}", nombre, nivel),
                            ).clicked() {
                                self.indice = indice;
                                self.lead.carrera = Some((*nombre).clone());
                            }
                        }
                    });

                    ui.add_space(12.0);
                    ui.horizontal(|ui| {
                        let cargar = egui::Button::new(
                            egui::RichText::new("Cargar lead").color(TEXTO).strong(),
                        ).fill(VERDE).min_size(egui::vec2(150.0, 34.0));
                        let negocio = egui::Button::new(
                            egui::RichText::new("Cargar negocio").color(TEXTO).strong(),
                        ).fill(DORADO).min_size(egui::vec2(150.0, 34.0));
                        if ui.add_enabled(self.estado != Estado::Cargando, cargar).clicked() {
                            self.cargar(Modo::Contacto, false);
                        }
                        if ui.add_enabled(self.estado != Estado::Cargando, negocio).clicked() {
                            self.cargar(Modo::Negocio, false);
                        }
                    });
                    ui.horizontal(|ui| {
                        let lead_viendo = egui::Button::new(
                            egui::RichText::new("Cargar lead viendo").color(TEXTO).strong(),
                        ).fill(AZUL).min_size(egui::vec2(150.0, 34.0));
                        let negocio_viendo = egui::Button::new(
                            egui::RichText::new("Cargar negocio viendo").color(TEXTO).strong(),
                        ).fill(AZUL).min_size(egui::vec2(150.0, 34.0));
                        if ui.add_enabled(self.estado != Estado::Cargando, lead_viendo).clicked() {
                            self.cargar(Modo::Contacto, true);
                        }
                        if ui.add_enabled(self.estado != Estado::Cargando, negocio_viendo).clicked() {
                            self.cargar(Modo::Negocio, true);
                        }
                    });
                });

            ui.add_space(12.0);
            ui.add(egui::Label::new(
                egui::RichText::new("Estado").size(16.0).color(ACENTO).strong(),
            ));
            if !self.paso.is_empty() {
                ui.add(egui::Label::new(egui::RichText::new(&self.paso).color(ACENTO)));
            }
            egui::ScrollArea::vertical().max_height(150.0).show(ui, |ui| {
                for linea in &self.registro {
                    if linea.starts_with("Error") {
                        ui.add(egui::Label::new(egui::RichText::new(linea.as_str()).color(ALERTA)));
                    } else {
                        ui.monospace(linea.as_str());
                    }
                }
            });
            if !self.error.is_empty() {
                ui.add(egui::Label::new(egui::RichText::new(&self.error).color(ALERTA).strong()));
            }
        });
    }
}

fn main() -> eframe::Result<()> {
    let (tx, rx) = mpsc::channel();
    let opciones = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default().with_inner_size([560.0, 760.0]),
        ..Default::default()
    };
    eframe::run_native(
        "Carga de leads",
        opciones,
        Box::new(move |_cc| Ok(Box::new(AppCarga::nueva(tx.clone(), rx)))),
    )
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn valida_el_formulario() {
        let lead = Lead::nuevo(
            "Ejemplo", "Prueba", "0000000000",
            "ejemplo@example.invalid", Some("Abogacía".into()),
        );
        assert!(lead.validar().is_ok());
    }

    #[test]
    fn rechaza_un_correo_invalido() {
        let lead = Lead::nuevo("Ejemplo", "Prueba", "0000000000", "sin-arroba", Some("Abogacía".into()));
        assert!(lead.validar().is_err());
    }

    #[test]
    fn convierte_eventos_del_auxiliar() {
        assert_eq!(
            Evento::desde_linea(r#"{"evento":"paso","texto":"Creando el negocio"}"#),
            Some(Evento::Paso("Creando el negocio".into()))
        );
        assert_eq!(Evento::desde_linea("no es json"), None);
    }

    #[test]
    fn al_cerrar_la_ventana_la_sesion_vuelve_a_cerrada() {
        let (tx, rx) = mpsc::channel();
        let mut app = AppCarga::nueva(tx, rx);
        app.sesion = Sesion::Abierta;
        app.registrar(Evento::SesionCerrada);
        assert_eq!(app.sesion, Sesion::Cerrada);
    }

    #[test]
    fn acumula_los_pasos_en_el_registro() {
        let (tx, rx) = mpsc::channel();
        let mut app = AppCarga::nueva(tx, rx);
        app.registrar(Evento::Paso("Buscando el contacto".into()));
        app.registrar(Evento::Paso("Creando el negocio".into()));
        assert_eq!(app.registro, ["Buscando el contacto", "Creando el negocio"]);
        assert_eq!(app.paso, "Creando el negocio");
    }
}
