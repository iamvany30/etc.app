import sys
import json
import time
import os

ORIGINAL_STDOUT = sys.stdout
sys.stdout = sys.stderr

os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["NO_COLOR"] = "1"

if sys.stderr.encoding != 'utf-8':
    try:
        sys.stderr.reconfigure(encoding='utf-8')
    except: pass

try:
    from seleniumbase import SB
except ImportError:
    ORIGINAL_STDOUT.write(json.dumps({"success": False, "error": "SeleniumBase missing"}))
    sys.exit(1)

TARGET_DOMAIN = "xn--d1ah4a.com"
LOGIN_URL = f"https://{TARGET_DOMAIN}/login"
TARGET_COOKIE_NAME = "refresh_token"

def send_log(message):
    timestamp = time.strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}", file=sys.stderr, flush=True)

def find_token(driver):
    """Ищем токен в куках (Hybrid method)"""
    found_names = []
    token = None
    
    try:
        data = driver.execute_cdp_cmd('Network.getAllCookies', {})
        for c in data.get('cookies', []):
            name = c.get('name')
            found_names.append(name)
            if name == TARGET_COOKIE_NAME:
                return c.get('value'), found_names
    except: pass

    if not token:
        try:
            for c in driver.get_cookies():
                name = c.get('name')
                if name not in found_names: found_names.append(name)
                if name == TARGET_COOKIE_NAME:
                    return c.get('value'), found_names
        except: pass
        
    return None, found_names

def main():
    send_log("Запуск (v4 Passive)...")
    
    with SB(uc=True, test=True, locale="ru", uc_cdp=True, page_load_strategy="eager") as sb:
        try:
            sb.driver.set_window_size(600, 850)
            
            send_log(f"Открываю страницу...")
            try:
                sb.driver.get(LOGIN_URL)
            except:
                send_log("Страница грузится долго, но продолжаем...")

            send_log("--- ЦИКЛ ПОИСКА ЗАПУЩЕН ---")
            send_log("Пожалуйста, войдите вручную (введите логин/пароль).")

            found_token = None
            start_time = time.time()
            
            while time.time() - start_time < 600:
                try:
                    if not sb.driver.window_handles:
                        send_log("Окно закрыто.")
                        break
                except: break

                token, cookie_names = find_token(sb.driver)
                
                if token:
                    found_token = token
                    send_log(f"✅ УСПЕХ! Токен найден.")
                    break
                
                if int(time.time()) % 2 == 0:
                    short_list = str(cookie_names[:3]).replace('[','').replace(']','')
                    if len(cookie_names) > 3: short_list += "..."
                    send_log(f"Поиск... Вижу: {short_list or 'пусто'}")
                    time.sleep(1.1)

                time.sleep(0.5)

            if found_token:
                ORIGINAL_STDOUT.write(json.dumps({"success": True, "token": found_token}))
            else:
                ORIGINAL_STDOUT.write(json.dumps({"success": False, "error": "Не удалось найти токен"}))
            ORIGINAL_STDOUT.flush()

        except Exception as e:
            send_log(f"ОШИБКА: {e}")
            ORIGINAL_STDOUT.write(json.dumps({"success": False, "error": str(e)}))
            ORIGINAL_STDOUT.flush()

if __name__ == "__main__":
    main()