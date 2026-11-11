import type { Locale } from "../../i18n/config.ts";
import type { LegalDoc } from "./types.ts";

// The Korean text is the reference version. Keep the four versions in step.

const ko: LegalDoc = {
  title: "개인정보처리방침",
  intro:
    "KONCI(이하 \"서비스\")는 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」 등 관련 법령을 따릅니다. 이 방침은 서비스가 어떤 정보를 왜 모으고, 어떻게 쓰고 보관하며, 이용자가 어떤 권리를 갖는지 설명합니다.",
  sections: [
    {
      heading: "1. 수집하는 개인정보와 방법",
      paragraphs: ["서비스는 아래 정보를 이용자가 직접 입력하거나 Google 로그인을 통해 받습니다."],
      items: [
        "로그인할 때(필수): Google 계정으로 로그인하면 이름, 이메일 주소, 프로필 사진을, 이메일로 로그인하면 이메일 주소를 받습니다. Google 계정의 이름은 닉네임의 초기값으로 쓰이고, 이메일 로그인은 임의의 닉네임이 부여됩니다.",
        "프로필(선택): 닉네임, 국적, 연령대, 성별. 입력하지 않아도 서비스를 이용할 수 있습니다.",
        "후기를 쓸 때(필수): 진료비 영수증 사진, 영수증에서 읽은 병원명·결제일·결제 금액, 후기 내용·평점·방문일·진료 항목. 영수증에는 진료 내역 등 건강에 관한 정보가 포함될 수 있습니다.",
        "병원 관리자 신청 시: 신청자의 소속·역할 설명과 증빙 서류(사업자등록증, 재직 증명 등).",
        "신고·수정 요청 시: 신고 사유와 제출한 내용. 건의사항 게시판에 글을 쓸 때: 제목과 내용(작성자와 운영자만 볼 수 있습니다).",
        "자동으로 생성되는 정보: 로그인 상태를 유지하는 쿠키, 언어 설정 쿠키, 접속 기록(IP 주소, 접속 시각, 브라우저 정보)이 호스팅·인증 서비스에 남을 수 있습니다. 또한 쿠키 없이 페이지별 방문 수와 대략적인 국가, 기기·브라우저 종류를 통계로 집계합니다(Vercel Web Analytics). 검색어 등 주소의 질의 부분과 로그인·마이페이지·관리자 화면은 집계하지 않습니다.",
      ],
    },
    {
      heading: "2. 이용 목적",
      items: [
        "회원 식별과 로그인 유지, 부정 이용 방지",
        "영수증으로 실제 방문을 확인하고 후기를 게시하기 위한 검증(자동 판독 후, 필요하면 관리자가 확인)",
        "후기·병원 정보의 게시, 병원별 평점 집계",
        "신고와 수정 요청의 처리, 병원 관리자 자격 확인",
        "서비스 개선을 위한 통계(개인을 식별할 수 없는 형태)",
        "문의 응대와 공지",
      ],
    },
    {
      heading: "3. 영수증 등 민감한 정보의 처리",
      paragraphs: [
        "영수증 사진은 비공개 저장소에 보관되며 다른 이용자에게 공개되지 않습니다. 후기 검증을 위해 영수증 문자 인식(OCR)을 하며, 이 과정에서 영수증 이미지가 아래 \"처리 위탁\"의 업체로 전송됩니다.",
        "영수증에 진료 내역이 포함되어 있을 수 있으므로, 영수증을 올리기 전에 이 처리에 동의하는지 확인합니다. 동의하지 않으면 영수증 인증이 필요한 후기는 쓸 수 없으며, 그 밖의 서비스는 그대로 이용할 수 있습니다. 주민등록번호, 카드 번호 등은 가리고 올리시길 권합니다.",
      ],
    },
    {
      heading: "4. 공개되는 정보",
      items: [
        "후기를 올리면 닉네임, 프로필 사진, 후기 내용, 평점, 방문일, 진료 항목이 다른 이용자에게 공개됩니다. 국적·연령대·성별을 입력했다면 후기에 함께 표시될 수 있습니다.",
        "이메일 주소, 영수증 이미지, 관리자 신청 증빙 서류, 신고 내용은 공개되지 않습니다.",
      ],
    },
    {
      heading: "5. 보유 기간과 파기",
      paragraphs: [
        "개인정보는 수집·이용 목적을 이루면 지체 없이 파기합니다. 다만 아래의 경우에는 해당 기간 동안 보관합니다.",
      ],
      items: [
        "회원 정보와 후기: 회원 탈퇴 또는 삭제 요청 시까지",
        "영수증 이미지와 판독 결과: 해당 후기가 게시되어 있는 동안입니다. 후기를 삭제하면 함께 삭제되고, 후기를 쓰지 않은 영수증은 업로드 30일 뒤(심사 중이면 심사가 끝난 뒤) 삭제됩니다. 같은 영수증의 재사용을 막기 위한 식별값(해시)만 더 오래 보관하며, 이 값으로는 영수증 내용을 알 수 없습니다",
        "관리자 신청 증빙 서류: 심사가 끝나고 관리자 자격이 유지되는 동안, 자격이 끝나면 파기",
        "법령에 따라 보관해야 하는 정보(예: 통신사실확인자료 등 접속 기록 3개월 이상): 해당 법령이 정한 기간",
      ],
    },
    {
      heading: "6. 제3자 제공",
      paragraphs: [
        "서비스는 이용자의 동의가 있거나 법령에 근거가 있는 경우(수사기관의 적법한 요청 등)를 제외하고 개인정보를 제3자에게 제공하지 않습니다.",
      ],
    },
    {
      heading: "7. 처리 위탁과 국외 이전",
      paragraphs: ["서비스 운영을 위해 아래 업체에 개인정보 처리를 맡기거나, 해당 업체의 서버에 개인정보를 보관합니다. 일부 서버는 국외에 있을 수 있습니다."],
      items: [
        "Supabase Inc.: 회원 인증, 데이터베이스와 파일(영수증 이미지 등) 저장",
        "Google LLC: 로그인(Google 계정 인증)",
        "네이버클라우드(NAVER Cloud) CLOVA OCR: 영수증 문자 인식",
        "웹 호스팅 사업자: 서비스 서버 운영(배포 후 확정되는 대로 이 항목에 기재합니다)",
        "이전 항목은 위 각 업체에 맡기는 정보와 같으며, 이전 시기와 방법은 서비스 이용 시 네트워크를 통한 전송입니다. 국외 이전을 원하지 않으면 서비스 이용을 중단하고 탈퇴를 요청할 수 있습니다.",
      ],
    },
    {
      heading: "8. 이용자의 권리",
      paragraphs: [
        "이용자는 언제든지 자신의 개인정보를 열람·정정·삭제하거나 처리를 멈추도록 요구하고, 동의를 철회할 수 있습니다. 닉네임·국적·연령대·성별은 \"내 정보\" 화면에서 직접 고치고, 작성한 후기는 직접 삭제할 수 있습니다. 회원 탈퇴는 \"내 정보\" 화면의 \"회원 탈퇴\"에서 직접 할 수 있으며, 탈퇴하면 후기·영수증·관리자 신청 서류를 포함한 모든 정보가 즉시 삭제됩니다. 그 밖의 요청은 아래 연락처로 보내 주시면 지체 없이 처리합니다.",
      ],
    },
    {
      heading: "9. 쿠키",
      paragraphs: [
        "서비스는 로그인 상태 유지와 언어 설정을 위한 필수 쿠키만 사용하며, 광고·행태 분석 목적의 쿠키는 사용하지 않습니다. 브라우저 설정에서 쿠키를 막을 수 있으나, 그 경우 로그인이 유지되지 않을 수 있습니다.",
      ],
    },
    {
      heading: "10. 안전성 확보 조치",
      items: [
        "영수증과 증빙 서류는 비공개 저장소에 두고, 접근은 서버와 관리자 권한으로 제한합니다.",
        "데이터베이스에 행 단위 접근 제어를 적용하고, 관리자 계정을 제한합니다.",
        "전송 구간은 암호화(HTTPS)합니다.",
      ],
    },
    {
      heading: "11. 어린이의 개인정보",
      paragraphs: ["서비스는 만 14세 미만 어린이를 대상으로 하지 않으며, 만 14세 미만의 가입을 받지 않습니다. 로그인할 때 만 14세 이상임을 직접 확인받으며, 14세 미만의 가입 사실을 알게 되면 해당 정보를 삭제합니다."],
    },
    {
      heading: "12. 문의처와 권리 구제",
      paragraphs: [
        "개인정보 관련 문의와 불만은 {contact}로 보내 주세요. 개인정보 보호책임자는 서비스 운영자입니다.",
        "침해를 받으셨다면 개인정보분쟁조정위원회(1833-6972), 개인정보침해신고센터(privacy.kisa.or.kr, 118), 대검찰청(1301), 경찰청(182)에 도움을 요청할 수 있습니다.",
      ],
    },
    {
      heading: "13. 방침의 변경",
      paragraphs: ["이 방침을 바꿀 때는 시행 7일 전부터 서비스 화면에 알립니다. 이용자에게 불리한 변경은 30일 전에 알립니다."],
    },
  ],
};

const en: LegalDoc = {
  title: "Privacy Policy",
  intro:
    "KONCI (the \"Service\") treats your personal information with care and follows the Personal Information Protection Act of Korea and related laws. This policy explains what we collect and why, how we use and keep it, and what rights you have.",
  sections: [
    {
      heading: "1. What we collect and how",
      paragraphs: ["We receive the following information from you directly or through Google sign-in."],
      items: [
        "When you sign in (required): with Google, the name, email address and profile photo of your Google account; with email, your email address. A Google name becomes your starting nickname; an email sign-in gets a generic one.",
        "Profile (optional): nickname, country, age group and gender. You can use the Service without filling these in.",
        "When you write a review (required): a photo of your medical receipt, the clinic name, payment date and amount read from it, and your review text, rating, visit date and treatment. A receipt can contain details of your treatment, which is health-related information.",
        "When you apply as a clinic manager: a description of your role and proof documents (for example a business registration or employment certificate).",
        "When you report or request a correction: the reason and what you submitted. When you post on the suggestion board: the title and text (visible only to you and the operators).",
        "Generated automatically: cookies that keep you signed in and remember your language, and access logs (IP address, time, browser information) that our hosting and authentication providers may keep. We also count page visits, with the approximate country and device and browser type, as statistics without cookies (Vercel Web Analytics). Search words and other query parts of the address, and the sign-in, My page and admin screens, are not counted.",
      ],
    },
    {
      heading: "2. Why we use it",
      items: [
        "To identify members, keep you signed in and prevent misuse",
        "To confirm that a visit really happened through the receipt before a review is published (automatic reading first, then an administrator if needed)",
        "To publish reviews and clinic information and to calculate clinic ratings",
        "To handle reports and correction requests and to check clinic manager eligibility",
        "To improve the Service with statistics that do not identify you",
        "To answer questions and send notices",
      ],
    },
    {
      heading: "3. Receipts and other sensitive information",
      paragraphs: [
        "Receipt photos are stored privately and are never shown to other users. To verify a review we read the receipt with optical character recognition (OCR), which sends the receipt image to the provider listed under \"Processors\" below.",
        "A receipt may show your treatment, so we ask for your consent before you upload one. If you do not agree you cannot write a receipt-verified review, but you can still use the rest of the Service. Please cover national ID numbers, card numbers and similar details before uploading.",
      ],
    },
    {
      heading: "4. What is made public",
      items: [
        "When you post a review, your nickname, profile photo, review text, rating, visit date and treatment are visible to others. If you entered a country, age group or gender, they may be shown with your review.",
        "Your email address, receipt images, manager proof documents and reports are not made public.",
      ],
    },
    {
      heading: "5. How long we keep it",
      paragraphs: ["We delete personal information without delay once its purpose is fulfilled. The following are kept for the periods shown."],
      items: [
        "Account details and reviews: until you leave or ask us to delete them",
        "Receipt images and reading results: while the related review is published. They are deleted with the review, and receipts that never led to a review are deleted 30 days after upload (once the check is finished, if it was pending). Only a hash that stops the same receipt being reused is kept longer; it does not reveal what the receipt shows",
        "Manager proof documents: while the review is pending and the manager role lasts; deleted when the role ends",
        "Information we must keep by law (for example access logs for at least three months): for the period the law sets",
      ],
    },
    {
      heading: "6. Sharing with third parties",
      paragraphs: ["We do not give personal information to third parties unless you agree or the law requires it, such as a lawful request from an investigating authority."],
    },
    {
      heading: "7. Processors and transfers abroad",
      paragraphs: ["We rely on the companies below to run the Service, and your information is stored on their servers. Some servers may be outside Korea."],
      items: [
        "Supabase Inc.: sign-in, database and file storage (including receipt images)",
        "Google LLC: sign-in (Google account authentication)",
        "NAVER Cloud CLOVA OCR: reading receipts",
        "Web hosting provider: running the Service (this entry will be completed once hosting is finalized)",
        "The information transferred is what is listed for each company above, sent over the network when you use the Service. If you do not want your information handled abroad, stop using the Service and ask us to delete your account.",
      ],
    },
    {
      heading: "8. Your rights",
      paragraphs: [
        "You can at any time ask to see, correct or delete your personal information, ask us to stop processing it, or withdraw your consent. You can edit your nickname, country, age group and gender on the \"My page\" screen and delete your own reviews yourself. You can leave the Service yourself with \"Delete account\" on the \"My page\" screen, which immediately deletes everything, including reviews, receipts and manager proof documents. For anything else, write to the address below and we will act without delay.",
      ],
    },
    {
      heading: "9. Cookies",
      paragraphs: ["We only use essential cookies for keeping you signed in and remembering your language. We do not use cookies for advertising or behavioral tracking. You can block cookies in your browser, but then you may not stay signed in."],
    },
    {
      heading: "10. Security",
      items: [
        "Receipts and proof documents are kept in private storage, and access is limited to the server and administrators.",
        "The database uses row-level access control and administrator accounts are limited.",
        "Data in transit is encrypted (HTTPS).",
      ],
    },
    {
      heading: "11. Children",
      paragraphs: ["The Service is not aimed at children under 14 and does not accept sign-ups from them. You confirm that you are 14 or older when you sign in, and if we learn that a child under 14 has signed up we will delete that information."],
    },
    {
      heading: "12. Contact and remedies",
      paragraphs: [
        "Send privacy questions and complaints to {contact}. The Service operator is the person responsible for privacy protection.",
        "If your rights are violated you can also contact the Personal Information Dispute Mediation Committee (1833-6972), the Personal Information Infringement Report Center (privacy.kisa.or.kr, 118), the Supreme Prosecutors' Office (1301) or the National Police Agency (182).",
      ],
    },
    {
      heading: "13. Changes",
      paragraphs: ["We announce changes in the Service at least 7 days before they take effect, and at least 30 days before changes that are less favorable to you."],
    },
  ],
};

const ja: LegalDoc = {
  title: "プライバシーポリシー",
  intro:
    "KONCI(以下「本サービス」)は、利用者の個人情報を大切に扱い、韓国の個人情報保護法などの関連法令に従います。本ポリシーでは、どのような情報をなぜ収集し、どのように利用・保管するか、また利用者にどのような権利があるかを説明します。",
  sections: [
    {
      heading: "1. 収集する個人情報と方法",
      paragraphs: ["以下の情報を、利用者の入力またはGoogleログインを通じて取得します。"],
      items: [
        "ログイン時(必須):Googleでログインする場合はGoogleアカウントの名前・メールアドレス・プロフィール写真、メールでログインする場合はメールアドレス。Googleの名前はニックネームの初期値になり、メールログインでは任意のニックネームが付きます。",
        "プロフィール(任意):ニックネーム、国籍、年代、性別。入力しなくても本サービスを利用できます。",
        "口コミ投稿時(必須):診療費領収書の写真、領収書から読み取った医療機関名・支払日・金額、口コミ本文・評価・受診日・診療内容。領収書には診療内容など健康に関する情報が含まれる場合があります。",
        "医療機関の管理者申請時:役割の説明と証明書類(事業者登録証、在職証明など)。",
        "通報・修正リクエスト時:理由と提出内容。ご意見板への投稿時:タイトルと本文(投稿者本人と運営者のみが閲覧できます)。",
        "自動的に生成される情報:ログイン状態維持用と言語設定用のCookie、およびアクセス記録(IPアドレス、時刻、ブラウザ情報)。ホスティング・認証事業者に残る場合があります。また、Cookieを使わずに、ページごとの訪問数とおおよその国、端末・ブラウザの種類を統計として集計します(Vercel Web Analytics)。検索語などアドレスのクエリ部分と、ログイン・マイページ・管理画面は集計しません。",
      ],
    },
    {
      heading: "2. 利用目的",
      items: [
        "会員の識別、ログイン状態の維持、不正利用の防止",
        "領収書による実際の受診の確認と口コミ掲載のための検証(自動読み取りの後、必要に応じて管理者が確認)",
        "口コミ・医療機関情報の掲載と、医療機関ごとの評価の集計",
        "通報・修正リクエストの処理、医療機関管理者の資格確認",
        "個人を特定できない形での統計によるサービス改善",
        "お問い合わせ対応とお知らせ",
      ],
    },
    {
      heading: "3. 領収書などセンシティブな情報の扱い",
      paragraphs: [
        "領収書の写真は非公開のストレージに保管され、他の利用者には表示されません。口コミの検証のため文字認識(OCR)を行い、その際、領収書の画像が下記「処理の委託」の事業者に送信されます。",
        "領収書には診療内容が含まれることがあるため、アップロード前にこの処理への同意をお願いしています。同意されない場合、領収書認証が必要な口コミは書けませんが、その他の機能は引き続き利用できます。マイナンバー相当の番号やカード番号などは隠してアップロードすることをおすすめします。",
      ],
    },
    {
      heading: "4. 公開される情報",
      items: [
        "口コミを投稿すると、ニックネーム、プロフィール写真、口コミ本文、評価、受診日、診療内容が他の利用者に公開されます。国籍・年代・性別を入力している場合は、口コミと一緒に表示されることがあります。",
        "メールアドレス、領収書画像、管理者申請の証明書類、通報内容は公開されません。",
      ],
    },
    {
      heading: "5. 保有期間と破棄",
      paragraphs: ["個人情報は、利用目的を達成した後、遅滞なく破棄します。ただし次の情報は、記載の期間保管します。"],
      items: [
        "会員情報と口コミ:退会または削除の依頼まで",
        "領収書画像と読み取り結果:該当の口コミが掲載されている間。口コミを削除すると一緒に削除され、口コミを書かなかった領収書はアップロードの30日後(審査中の場合は審査の終了後)に削除されます。同じ領収書の再利用を防ぐ識別値(ハッシュ)のみ、より長く保管します。この値から領収書の内容は分かりません",
        "管理者申請の証明書類:審査中および管理者資格が続く間。資格が終了したら破棄",
        "法令により保管が必要な情報(例:アクセス記録を3か月以上):法令が定める期間",
      ],
    },
    {
      heading: "6. 第三者への提供",
      paragraphs: ["利用者の同意がある場合、または捜査機関からの適法な要請など法令に根拠がある場合を除き、個人情報を第三者に提供しません。"],
    },
    {
      heading: "7. 処理の委託と国外への移転",
      paragraphs: ["サービス運営のため、以下の事業者に個人情報の処理を委託し、または各事業者のサーバーに保管します。一部のサーバーは国外にある場合があります。"],
      items: [
        "Supabase Inc.:会員認証、データベースとファイル(領収書画像など)の保管",
        "Google LLC:ログイン(Googleアカウント認証)",
        "NAVER Cloud CLOVA OCR:領収書の文字認識",
        "Webホスティング事業者:サービスサーバーの運営(確定次第、この項目に記載します)",
        "移転される情報は上記各社に委ねる情報と同じで、サービス利用時にネットワークを通じて送信されます。国外での取り扱いを望まない場合は、利用を中止し、退会を依頼してください。",
      ],
    },
    {
      heading: "8. 利用者の権利",
      paragraphs: [
        "利用者はいつでも、自身の個人情報の閲覧・訂正・削除、処理の停止、同意の撤回を求めることができます。ニックネーム・国籍・年代・性別は「マイページ」で自分で編集でき、投稿した口コミも自分で削除できます。退会は「マイページ」の「退会」から自分で行え、口コミ・領収書・管理者申請の書類を含むすべての情報が直ちに削除されます。その他のご依頼は、下記の連絡先までお送りください。遅滞なく対応します。",
      ],
    },
    {
      heading: "9. Cookie",
      paragraphs: ["本サービスは、ログイン状態の維持と言語設定のための必須Cookieのみを使用し、広告や行動分析目的のCookieは使用しません。ブラウザでCookieを無効にできますが、その場合ログインが維持されないことがあります。"],
    },
    {
      heading: "10. 安全管理措置",
      items: [
        "領収書と証明書類は非公開ストレージに置き、アクセスをサーバーと管理者権限に限定します。",
        "データベースに行単位のアクセス制御を適用し、管理者アカウントを限定します。",
        "通信経路を暗号化(HTTPS)します。",
      ],
    },
    {
      heading: "11. 子どもの個人情報",
      paragraphs: ["本サービスは14歳未満の子どもを対象とせず、14歳未満の登録を受け付けません。ログイン時に14歳以上であることをご自身で確認していただき、14歳未満の登録が判明した場合は、その情報を削除します。"],
    },
    {
      heading: "12. お問い合わせ先と救済手段",
      paragraphs: [
        "個人情報に関するお問い合わせ・苦情は {contact} までお送りください。個人情報保護責任者はサービス運営者です。",
        "権利の侵害を受けた場合は、個人情報紛争調停委員会(1833-6972)、個人情報侵害申告センター(privacy.kisa.or.kr、118)、最高検察庁(1301)、警察庁(182)にも相談できます。",
      ],
    },
    {
      heading: "13. ポリシーの変更",
      paragraphs: ["本ポリシーを変更する場合は、施行の7日前からサービス上でお知らせします。利用者に不利な変更は30日前にお知らせします。"],
    },
  ],
};

const zh: LegalDoc = {
  title: "隐私政策",
  intro:
    "KONCI(以下简称“本服务”)重视用户的个人信息,并遵守韩国《个人信息保护法》等相关法律。本政策说明我们收集哪些信息、为何收集、如何使用和保存,以及您享有哪些权利。",
  sections: [
    {
      heading: "1. 收集的个人信息与方式",
      paragraphs: ["我们通过您的直接填写或 Google 登录获取以下信息。"],
      items: [
        "登录时(必填):使用 Google 登录时为 Google 账号的姓名、电子邮箱和头像;使用电子邮箱登录时为电子邮箱。Google 姓名将作为昵称的初始值,电子邮箱登录则会分配一个随机昵称。",
        "个人资料(选填):昵称、国籍、年龄段、性别。不填写也可使用本服务。",
        "撰写评价时(必填):医疗收据照片,从中识别出的医院名称、付款日期和金额,以及评价内容、评分、就诊日期和诊疗项目。收据可能包含诊疗明细等与健康有关的信息。",
        "申请成为医院管理员时:对职责的说明和证明文件(如营业执照、在职证明)。",
        "举报或提交更正请求时:理由和所提交的内容。在建议留言板发帖时:标题和内容(仅您本人和运营者可见)。",
        "自动生成的信息:用于保持登录状态和记住语言的 Cookie,以及访问记录(IP 地址、访问时间、浏览器信息),托管和认证服务商可能会保留这些记录。此外,我们在不使用 Cookie 的情况下统计各页面的访问量、大致国家以及设备和浏览器类型(Vercel Web Analytics)。搜索词等网址中的查询部分,以及登录、我的页面和管理页面不计入统计。",
      ],
    },
    {
      heading: "2. 使用目的",
      items: [
        "识别会员、保持登录状态、防止滥用",
        "通过收据确认确实到访,并在发布评价前进行核验(先自动识别,必要时由管理员确认)",
        "发布评价和医院信息,统计各医院的评分",
        "处理举报和更正请求,确认医院管理员资格",
        "以无法识别个人的统计数据改进服务",
        "答复咨询和发送通知",
      ],
    },
    {
      heading: "3. 收据等敏感信息的处理",
      paragraphs: [
        "收据照片保存在非公开的存储中,不会向其他用户显示。为核验评价,我们会对收据进行文字识别(OCR),此过程中收据图片会发送给下文“委托处理”中列出的服务商。",
        "收据可能包含诊疗内容,因此在您上传前会征求您对该处理的同意。如不同意,则无法撰写需要收据认证的评价,但仍可使用其他功能。建议上传前遮盖身份证号、银行卡号等信息。",
      ],
    },
    {
      heading: "4. 会公开的信息",
      items: [
        "发布评价后,您的昵称、头像、评价内容、评分、就诊日期和诊疗项目会向其他用户公开。如果您填写了国籍、年龄段或性别,它们可能与评价一同显示。",
        "您的电子邮箱、收据图片、管理员申请的证明文件和举报内容不会公开。",
      ],
    },
    {
      heading: "5. 保存期限与销毁",
      paragraphs: ["个人信息在达成使用目的后会立即销毁。以下信息按所列期限保存。"],
      items: [
        "会员信息与评价:直至您退出或要求删除",
        "收据图片与识别结果:在相关评价发布期间。删除评价时一并删除;未用于撰写评价的收据在上传 30 天后删除(审核中的在审核结束后)。仅保留用于防止同一收据重复使用的标识值(哈希),保存时间更长,无法据此得知收据内容",
        "管理员申请的证明文件:审核期间及管理员资格持续期间,资格终止后销毁",
        "依法必须保存的信息(例如访问记录至少三个月):法律规定的期限",
      ],
    },
    {
      heading: "6. 向第三方提供",
      paragraphs: ["除非经您同意或法律有规定(如侦查机关的合法要求),我们不会向第三方提供个人信息。"],
    },
    {
      heading: "7. 委托处理与向境外传输",
      paragraphs: ["为运营本服务,我们委托以下公司处理个人信息,或将个人信息存放在这些公司的服务器上。部分服务器可能位于韩国境外。"],
      items: [
        "Supabase Inc.:会员认证、数据库与文件(含收据图片)存储",
        "Google LLC:登录(Google 账号认证)",
        "NAVER Cloud CLOVA OCR:收据文字识别",
        "网站托管服务商:运行服务器(托管确定后会在此补充)",
        "传输的信息与上述各公司所处理的信息相同,在您使用本服务时通过网络传送。如不希望信息在境外处理,请停止使用并要求注销账号。",
      ],
    },
    {
      heading: "8. 您的权利",
      paragraphs: [
        "您可以随时要求查阅、更正或删除您的个人信息,要求停止处理,或撤回同意。昵称、国籍、年龄段和性别可在“我的页面”自行修改,您发布的评价也可自行删除。注销账号可在“我的页面”的“注销账号”中自行完成,包括评价、收据和管理员申请文件在内的所有信息会立即删除。其他请求请发送至下方联系方式,我们会及时处理。",
      ],
    },
    {
      heading: "9. Cookie",
      paragraphs: ["本服务仅使用保持登录状态和记住语言所必需的 Cookie,不使用用于广告或行为分析的 Cookie。您可以在浏览器中禁用 Cookie,但这样可能无法保持登录。"],
    },
    {
      heading: "10. 安全措施",
      items: [
        "收据和证明文件存放在非公开存储中,访问仅限服务器和管理员权限。",
        "数据库采用行级访问控制,并限制管理员账号。",
        "传输过程加密(HTTPS)。",
      ],
    },
    {
      heading: "11. 儿童的个人信息",
      paragraphs: ["本服务不面向未满 14 周岁的儿童,也不接受其注册。登录时需由您自行确认已年满 14 周岁;如发现有未满 14 周岁者注册,我们将删除相关信息。"],
    },
    {
      heading: "12. 联系方式与救济途径",
      paragraphs: [
        "有关个人信息的咨询和投诉,请发送至 {contact}。个人信息保护负责人为服务运营者。",
        "如权益受到侵害,您还可以向个人信息纠纷调解委员会(1833-6972)、个人信息侵权举报中心(privacy.kisa.or.kr,118)、最高检察厅(1301)、警察厅(182)寻求帮助。",
      ],
    },
    {
      heading: "13. 政策的变更",
      paragraphs: ["修改本政策时,我们会在生效前至少 7 天在服务中公告;对用户不利的修改,将提前至少 30 天公告。"],
    },
  ],
};

export const PRIVACY: Record<Locale, LegalDoc> = { ko, en, ja, zh };
