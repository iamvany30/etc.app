import sys
import json
import time
import os


os.environ["PYTHONIOENCODING"] = "utf-8"
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except: pass

try:
    import undetected_chromedriver as uc
except ImportError:
    print(json.dumps({"success": False, "error": "undetected_chromedriver not installed"}))
    sys.exit(1)

def send_log(message):
    sys.stderr.write(f"[{time.strftime('%H:%M:%S')}] {message}\n")
    sys.stderr.flush()

def main():
    send_log("Запуск движка авторизации...")
    
    options = uc.ChromeOptions()
    
    options.add_argument(f"--app=https://xn--d1ah4a.com/login")
    options.add_argument("--disable-extensions")
    options.add_argument("--no-first-run")
    options.add_argument("--no-default-browser-check")

    driver = None
    try:
        driver = uc.Chrome(options=options, headless=False)
        driver.set_window_size(550, 850)
        send_log("Окно открыто. Ожидание входа...")
        
        start_time = time.time()
        while time.time() - start_time < 600: 
            if not driver.window_handles:
                break
            
            try:
                
                res = driver.execute_cdp_cmd('Network.getAllCookies', {})
                cookies = res.get('cookies', [])
                token = next((c['value'] for c in cookies if c['name'] == 'refresh_token'), None)
                
                if token:
                    send_log("Сессия захвачена!")
                    
                    print(json.dumps({"success": True, "token": token}))
                    sys.stdout.flush()
                    
                    
                    
                    try:
                        driver.quit()
                    except:
                        pass
                    os._exit(0) 
            except:
                pass
                
            time.sleep(1)
        
        print(json.dumps({"success": False, "error": "Closed"}))
    except Exception as e:
        send_log(f"Ошибка: {str(e)}")
        print(json.dumps({"success": False, "error": str(e)}))
    finally:
        if driver:
            try: driver.quit()
            except: pass
        os._exit(0)

if __name__ == "__main__":
    main()