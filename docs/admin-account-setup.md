# 관리자 계정 설정

관리자(`isAdmin = true`) 계정은 **사업자등록 검증 없이** 다음 기능을 모두 사용할 수 있습니다.

- 시설 등록·이미지 업로드
- 스포츠용품(상품) 등록
- 이벤트매치 개최
- (추후) 공지사항 등록 등

## 관리자로 지정하는 방법

DB에서 해당 유저의 `is_admin` 값을 `true`로 설정합니다.

### PostgreSQL 예시

```sql
-- 이메일로 지정
UPDATE users SET is_admin = true WHERE email = 'admin@example.com';

-- 또는 유저 ID로 지정
UPDATE users SET is_admin = true WHERE id = 1;
```

### 주의사항

- `users` 테이블에 `is_admin` 컬럼이 있어야 합니다. (기본값 `false`)
- 서버 재시작 없이 DB만 수정해도 반영됩니다.
- 관리자 계정은 한 명만 두거나, 필요 시 여러 명 지정할 수 있습니다.
