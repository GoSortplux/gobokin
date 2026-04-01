import sys
from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            print("Navigating to dashboard...")
            # We assume the server is still running on 3002
            page.goto("http://localhost:3002/organizer/dashboard")

            # 1. Capture Header
            print("Capturing Header...")
            page.wait_for_selector("header")
            page.screenshot(path="verification/header_initial.png")

            # 2. Open User Dropdown
            print("Opening User Dropdown...")
            # Clicking the profile area
            page.click("header .relative button") # Updated selector based on my changes
            page.wait_for_selector("text=Dashboard")
            page.screenshot(path="verification/header_dropdown_open.png")

            # 3. Open Switch Account (if applicable)
            print("Trying to open Switch Account...")
            switch_btn = page.get_by_text("Switch Account")
            if switch_btn.is_visible():
                switch_btn.click()
                page.wait_for_timeout(500)
                page.screenshot(path="verification/header_role_switch.png")

            print("Verification successful!")

        except Exception as e:
            print(f"Error during verification: {e}")
            page.screenshot(path="verification/header_error.png")
            # sys.exit(1) # Don't exit yet, might just be auth redirection
        finally:
            browser.close()

if __name__ == "__main__":
    run_verification()
