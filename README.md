# menkakusitsu-back

제주과학고 학교생활 서비스의 백엔드입니다.

## 개발 방법

1. [VSCode](https://code.visualstudio.com/download), [git](https://git-scm.com/downloads), [Node.js](https://nodejs.org/ko/) 설치
2. Node.js 설치가 끝나면 재부팅
3. VSCode 실행후 F1 -> git clone -> 해당 레포 주소 입력 -> 레포 다운받을 폴더 선택
4. 상단 바 -> 터미널 -> 새 터미널 -> menkakusitsu-back 선택
5. `npm install`을 통해 필요한 패키지 설치
6. `npm run dev`을 통해 개발 서버 실행 가능
> 개발 서버는 수정된 코드를 저장하면 자동으로 리로드 됨
7. 수정 사항은 커밋 후 마스터 브랜치에 푸시
> 사이트 잘 작동하는지 확인 후 푸시할 것

## 프로덕션 서버 올리는 방법

1. VPN 연결 후 VNC를 통해 10.8.0.86에 접속
2. VSCode로 프로젝트 연 후에 fetch로 변경 사항 다운로드
> 패키지 변경 사항이 있다면 `npm install` 실행
> 프로덕션 서버는 수정된 코드를 저장하면 자동으로 리로드 됨
> 서버 안 켜졌으면 `npm run start` 실행
