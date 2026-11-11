# 배포 체크리스트

코드 쪽 준비(빌드·타입·린트·테스트 통과, 보안 헤더, 환경 변수 목록)는 끝났습니다. 아래는 **계정·대시보드에서 직접 해야 하는 일**입니다. 위에서부터 순서대로 하세요.

키와 비밀번호는 각 서비스의 환경 변수 화면에만 넣고, 채팅·커밋·README에는 적지 않습니다.

## 1. 호스팅 정하기

Next.js 16 서버 렌더링이 필요합니다(정적 내보내기 불가). 가장 쉬운 선택은 Vercel이고, 직접 서버를 쓴다면 `npm run build` 후 `npm run start`로 띄웁니다.

- [ ] 호스팅 업체와 서버 위치(국가)를 정한다. 이 두 가지는 개인정보처리방침의 "국외 이전·처리위탁" 항목에 그대로 적어야 한다.
- [ ] GitHub 저장소(`jeongsemin/konci`)를 연결하고 `main`을 배포 브랜치로 지정한다.

## 1-1. 도메인 (konci.kr)

- [ ] 국내 등록 업체(가비아·후이즈·카페24 등)에서 `konci.kr` 구입 (Cloudflare Registrar는 `.kr`을 팔지 않음)
- [ ] Cloudflare 무료 플랜에 `konci.kr` 사이트 추가 → 등록 업체 관리 화면에서 네임서버를 Cloudflare가 알려 준 두 개로 변경
- [ ] 호스팅에 `konci.kr`(필요하면 `www.konci.kr`도)을 연결하고, 호스팅이 안내하는 DNS 레코드를 Cloudflare에 추가
- [ ] Vercel을 쓴다면 해당 레코드는 Cloudflare 프록시(주황 구름)를 끄고 "DNS only"로 둔다

## 2. 환경 변수 (호스팅 설정 화면에 입력)

| 변수 | 필수 | 값 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 예 | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 예 | 같은 화면의 anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 예 | 같은 화면의 service_role key (서버 전용, `NEXT_PUBLIC_` 붙이지 않기) |
| `NEXT_PUBLIC_SITE_URL` | 예 | 실제 주소, `https://konci.kr` (끝에 `/` 없이) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 예 | 약관·방침에 표시될 문의 메일 |
| `NAVER_SEARCH_CLIENT_ID` / `_SECRET` | 선택 | 없으면 심평원 데이터만 검색 |
| `CLOVA_OCR_INVOKE_URL` / `_SECRET` | 선택 | 없으면 모든 영수증이 수동 심사 |

`HIRA_SERVICE_KEY`는 본인 PC에서 병원 데이터를 가져올 때만 쓰므로 호스팅에는 넣지 않습니다.

## 3. Supabase 설정

- [ ] Authentication > URL Configuration
  - Site URL: `https://konci.kr`
  - Redirect URLs: `https://konci.kr/auth/callback` 추가
- [ ] Google 로그인: Google Cloud Console의 OAuth 클라이언트에 승인된 리디렉션 URI로 Supabase 콜백 주소(`https://tkovpirqrbmshkiwfbsl.supabase.co/auth/v1/callback`)가 있는지 확인. 동의 화면을 "프로덕션"으로 게시하지 않으면 테스트 사용자만 로그인할 수 있다.
- [ ] 이메일 로그인용 SMTP: Authentication > SMTP Settings에 메일 서비스를 연결한다. 기본 메일은 시간당 발송 한도가 작고 영어 템플릿이라 실서비스에 부적합하다. 연결 후 Authentication > Email Templates의 매직 링크 문구를 한국어·영어 등으로 고친다.
- [ ] 마이그레이션 0001–0013이 모두 적용돼 있는지 확인(현재 적용 완료).
- [ ] 관리자 계정이 지정돼 있는지 확인.

## 4. 병원 데이터

- [ ] 심평원(공공데이터포털) 키로 `scripts/import-hira.ts`를 실행해 병원 목록을 채운다. 폐업 정보 반영을 위해 매월 다시 실행하는 것을 권장한다.

## 5. 영수증 정리 예약

후기가 없는 영수증 사진은 30일 뒤 지워야 합니다(개인정보처리방침에 적은 보관 기간).

- [ ] `node --env-file=.env.local scripts/purge-receipts.ts --dry-run`으로 먼저 개수만 확인
- [ ] 매일 한 번 `node --env-file=.env.local scripts/purge-receipts.ts`가 돌도록 예약(작업 스케줄러, cron, GitHub Actions 중 편한 것)

## 6. 배포 직후 확인

- [ ] 메인, 검색, 병원 상세 페이지가 열린다
- [ ] 구글 로그인 / 이메일 링크 로그인이 된다 (이메일은 요청한 브라우저에서 링크를 열어야 한다)
- [ ] 후기 작성 → 영수증 업로드 → (관리자) 승인 흐름
- [ ] `/robots.txt`, `/sitemap.xml`이 실제 도메인으로 나온다
- [ ] 응답 헤더에 `X-Frame-Options`, `Strict-Transport-Security`가 있다
- [ ] 약관·방침 하단의 문의 메일이 실제 주소다
- [ ] 사이트 이름이 KONCI로 나온다 (탭 제목, 헤더 로고, 푸터)

## 7. 공개 전에 사람이 해야 하는 일

- [ ] 이용약관·개인정보처리방침 법률 검토 (현재 초안), 호스팅·서버 국가 항목 채우기
- [ ] 일본어·중국어 문구 원어민 검수 (예약 안내 페이지 `/booking-guide`의 한국어 문장 카드와 로마자 표기 포함)
- [ ] 예약 안내의 1330·메디컬코리아(1577-7129) 번호와 운영 시간을 공식 사이트에서 다시 확인하고, 바꾸면 `src/lib/booking-guide.ts`의 확인 날짜도 고치기
- [ ] 법률 검토 때 예약 안내가 "정보 제공"에 머무는지(예약 대행·수수료 없음, 특정 병원 추천 없음) 함께 확인
- [ ] 만 14세 확인은 체크박스(본인 확인)임을 인지하고 정책을 확정

## 알려진 한계 (코드 쪽)

- Content-Security-Policy는 아직 없다. 스크립트 인라인과 외부 출처 목록을 맞춰 별도로 시험해 넣어야 한다.
- 새 건의사항 알림 메일이 없다. 관리자 화면의 건의사항 카드로 직접 확인한다.
