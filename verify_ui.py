import asyncio
import base64
import json
import time
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        # Mock auth
        user_obj = {
            "id": "admin_123",
            "role": ["super-admin"],
            "hasAcceptedLatestPolicies": True
        }

        # Base64 fake JWT
        header = base64.b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().replace('=', '')
        payload = base64.b64encode(json.dumps({
            "sub": "admin_123",
            "role": ["super-admin"],
            "exp": int(time.time()) + 3600
        }).encode()).decode().replace('=', '')
        fake_token = f"{header}.{payload}.signature"

        # Set localStorage
        await page.goto("http://localhost:3002")
        await page.evaluate(f"""() => {{
            localStorage.setItem('token', '{fake_token}');
            localStorage.setItem('user', '{json.dumps(user_obj)}');
            localStorage.setItem('lastActivity', '{int(time.time() * 1000)}');
        }}""")

        # 1. Verify Sidebar & Dashboard
        await page.goto("http://localhost:3002/admin/events/dashboard")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="v_dashboard.png")
        print("Dashboard/Sidebar verified")

        # 2. Verify User Management
        await page.goto("http://localhost:3002/admin/events/users")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="v_users.png")
        print("User Management verified")

        # 3. Verify Finance Tabs
        await page.goto("http://localhost:3002/admin/events/finance")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="v_finance_summary.png")

        # Click Withdraw Summary tab
        await page.click("text=Withdraw Summary")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="v_finance_withdrawals.png")
        print("Finance tabs verified")

        # 4. Verify Settings Tabs
        await page.goto("http://localhost:3002/admin/events/settings")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="v_settings_config.png")

        # Click Event Categories
        await page.click("text=Event Categories")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="v_settings_categories.png")

        # Click Subscription Packages
        await page.click("text=Subscription Packages")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="v_settings_packages.png")
        print("Settings tabs verified")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify())
