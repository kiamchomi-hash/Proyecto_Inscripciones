$content = Get-Content -Path './paginasiglo.html' -Encoding utf8
$data = $content[1543..1905] -join "`n"
$data = $data -replace 'const careersData = ', ''
$data = $data.Trim()
if ($data.EndsWith(';')) { $data = $data.Substring(0, $data.Length - 1) }
$data = $data -replace '//.*', ''
$data = $data -replace "'", '"'
$data = $data -replace '(\w+):', '"$1":'
$data = $data -replace ',\s*}', '}'
$data = $data -replace ',\s*]', ']'
$data | Out-File -FilePath './datos_carreras.json' -Encoding utf8
