import sys
import json
import rookiepy


if sys.stdout.encoding != 'UTF-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except: pass

TARGET_DOMAIN = "xn--d1ah4a.com"
TARGET_COOKIE = "refresh_token"

def log(message):
    print(f"[GRABBER] {message}", file=sys.stderr, flush=True)

def get_token():
    browsers = [
        ('Chrome', rookiepy.chrome),
        ('Edge', rookiepy.edge),
        ('Opera', rookiepy.opera),
        ('Brave', rookiepy.brave),
        ('Vivaldi', rookiepy.vivaldi),
        ('Firefox', rookiepy.firefox)
    ]

    log("Начинаю сканирование браузеров...")

    for name, loader in browsers:
        try:
            log(f"Проверка {name}...")
            cookies = loader([TARGET_DOMAIN])
            
            if cookies:
                for cookie in cookies:
                    c_name = getattr(cookie, 'name', None) or cookie.get('name')
                    c_value = getattr(cookie, 'value', None) or cookie.get('value')
                    if c_name == TARGET_COOKIE and c_value:
                        log(f"  > УСПЕХ! Токен найден в {name}")
                        return c_value
            else:
                log(f"  > В {name} сессия не обнаружена.")
                    
        except Exception as e:
            log(f"  > {name} пропущен (занят или не установлен)")
            continue

    return None

def main():
    try:
        token = get_token()
        if token:
            print(json.dumps({"success": True, "token": token}))
        else:
            print(json.dumps({"success": False, "error": "Token not found"}))
    except Exception as e:
        log(f"Критическая ошибка: {str(e)}")
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()