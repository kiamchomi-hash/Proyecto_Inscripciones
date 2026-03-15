import time
import sys
from playwright.sync_api import sync_playwright

time.sleep(3)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        for name, url in [
            ("sobre-nosotros", "http://localhost:3000/sobre-nosotros"),
            ("contacto", "http://localhost:3000/contacto"),
            ("novedades", "http://localhost:3000/novedades/1"),
        ]:
            print(f"Navigating to {url}...")
            page.goto(url, timeout=60000, wait_until="networkidle")
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(800)
            path = f"/tmp/{name}-bottom2.png"
            page.screenshot(path=path)
            print(f"  Screenshot saved: {path}")

        browser.close()
        print("Done!")
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
