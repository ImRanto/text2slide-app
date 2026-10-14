import os
from playwright.sync_api import sync_playwright

os.makedirs("./verification/screenshots", exist_ok=True)
os.makedirs("./verification/videos", exist_ok=True)

def run_cuj(page):
    page.goto("http://localhost:5173/")
    page.wait_for_timeout(1000)

    # Fill sample slides text
    textarea = page.locator("textarea")
    sample_text = (
        "Bienvenue sur Text2Slide\n"
        "Créer des diapositives facilement et rapidement\n"
        "100% hors-ligne et sécurisé\n"
        "\n"
        "---\n"
        "Voici un second paragraphe un peu plus long pour tester l'ajustement dynamique de la taille de la police.\n"
        "- Point 1\n"
        "- Point 2\n"
        "- Point 3"
    )
    textarea.fill(sample_text)
    page.wait_for_timeout(1000)

    # Click on "Taille max auto" button
    auto_fit_btn = page.locator("button:has-text('Taille max auto')")
    auto_fit_btn.click()
    page.wait_for_timeout(1000)

    # Take screenshot at the key moment showing the auto badge and fit font size
    page.screenshot(path="./verification/screenshots/verification.png")
    page.wait_for_timeout(1500)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="./verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
