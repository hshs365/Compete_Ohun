# 배포/운영 설정 요약 (2026-01-24)

## 1) 서버 구성
- 웹1: `192.168.132.185`
- 웹2: `192.168.132.126`
- DB: `192.168.132.81`
- LB: `192.168.132.147`

## 2) 백엔드/프론트 포트
- 백엔드: `3000`
- 프론트(Vite dev): `5173`
- LB Nginx: `80`

## 3) 백엔드 바인딩 및 실행
- 백엔드는 `0.0.0.0:3000`으로 외부 접근 허용
- 반영 파일: `server/src/main.ts`
  - `HOST` 환경변수 기본값 `0.0.0.0`
  - `app.listen(port, host)`로 변경

## 4) 프론트 Vite 호스트 허용
- `client/vite.config.ts`
  - `allowedHosts: ['ohun.kr', 'www.ohun.kr']`

## 5) LB Nginx 라우팅 분리
- `/api/` → 백엔드(3000)
- `/` → 프론트(5173)

예시 설정(`/etc/nginx/sites-available/default`):
```
upstream frontend_cluster {
    least_conn;
    server 192.168.132.185:5173;
    server 192.168.132.126:5173;
}

upstream backend_cluster {
    least_conn;
    server 192.168.132.185:3000;
    server 192.168.132.126:3000;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ohun.kr www.ohun.kr;

    location /api/ {
        proxy_pass http://backend_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://frontend_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 6) Cloudflare Tunnel (LB 전용)
- 신규 터널: `compete-ohun-tunnel` (LB에서만 실행)
- 라우트:
  - `www.ohun.kr` → `http://localhost:80`
  - `ohun.kr` → `http://localhost:80`
- 서비스 등록:
```
sudo cloudflared service install <TOKEN>
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

## 7) DNS 정리
- `ohun.kr` / `www` 기존 A/AAAA/CNAME 정리 후
- Tunnel CNAME만 유지

## 8) 로컬 DNS 이슈 해결 (LB)
- `resolvectl`로 업스트림 DNS 설정
```
sudo resolvectl dns <인터페이스> 1.1.1.1 8.8.8.8
sudo resolvectl flush-caches
```

## 9) 현재 상태 확인 명령
```
curl -I https://ohun.kr
curl -I https://www.ohun.kr
sudo systemctl status cloudflared
sudo nginx -t && sudo systemctl reload nginx
```
