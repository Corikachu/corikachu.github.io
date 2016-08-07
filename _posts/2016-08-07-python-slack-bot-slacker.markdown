---
layout: post
title: "[Python] Slacker를 이용한 Slack Bot 만들기"
excerpt: "개발 커뮤니티 GDG SSU 내부 슬랙에서 운영하고 있는 봇이 어떻게 만들어 졌는지 간단하게 확인해 봅시다."
date: 2016-08-07 01:00:00 +0900
categories: [python]
modified: 2016-08-07
comments: true
image:
  feature: https://cloud.githubusercontent.com/assets/4270075/17455501/6d6ed30e-5bf4-11e6-9f9b-85b50b1ee063.png
tag: [python, slack, bot]
---

제가 속해있는 Google Developer Groups Soongsil University(이하 GDG SSU)에서는 커뮤니케이션 툴로 [Slack][slack]을 사용중입니다. 잡담, 개발, 질문&답변을 각기 다른 채널에서 이야기 가능하고 코드 하이라이팅이 있어서 단순 메신져보다 코드 공유가 쉽다고 생각했기 때문입니다. 여러가지 편의를 위한 봇을 만들 수 있다는 것은 슬랙의 큰 장점인데요. 전 회사에서는 데이터베이스를 조회해서 성장 지표를 뽑아내거나, unix timestamp 형식으로 되있는 시간을 읽을 수 있는 시간으로 바꿔주는 등 여러가지 기능으로 운영했었는데요. 저도 이를 살려서 GDG SSU에서 1일 1커밋을 장려하기위한 'github 그래프 파싱 봇'과 '학교 공지 파싱 봇'을 운영중입니다. python과 django를 쓰면서 슬랙 봇은 어떻게 만들어볼까 하며 생각하다가 [공식 API문서][api-docs-community]에 추천한 python 오픈 소프 라이브러리인 [Slacker][slacker]를 사용하기로 했습니다.

아래는 현재 가동되고 있는 1일 1커밋 커맨드를 입력해서 시작일로부터 얼마나 커밋을 했는지 알려주는 화면과 학교 공지를 파싱해서 새로운 공지가 있으면 알려주는 슬랙의 사진입니다.

![gdgssu-slack-bot](https://cloud.githubusercontent.com/assets/4270075/17455473/e78e8180-5bf3-11e6-8900-69db0c5328a7.png){: .center-image}


## Bot의 등록

봇을 사용하기위하서는 봇을 등록하고 그 봇의 Token이 필요합니다. [Slack App 페이지][slack-app]에서 Build를 클릭해서 다른 팀에게 공개할 봇을 만들것인지, 아니면 현재 사용하고 있는 팀을 위한 슬랙 봇을 만들 것인지 선택합니다. 그 다음 봇을 하나 등록합니다. 이때 팀에 슬랙 Integration을 추가할 권한이 있어야합니다.

봇 페이지에서 필요한 부분들을 설정하고, Token은 잘 복사해 둡니다.

## REST API를 통한 메세지 보내기

Slacker는 `pip`를 통해서 설치합니다.
{% highlight shell %}
$ pip install slacker
{% endhighlight %}

메세지는 다음과 같이 보냅니다.
{% highlight python %}
from slacker import Slacker

token = 'xoxo-토큰토큰-유어토큰'
slack = Slacker(token)
slack.chat.post_message('#channel', 'message')
{% endhighlight %}

token부분에 아까 발급받은 봇의 token을 넣어줍니다. `post_message`에는 어디로 보낼지에 대한 `채널`과 보낼 `메세지`가 필수적으로 들어갑니다. 이렇게 보낸 메세지는 이름이 단순 bot으로 되어있는 무미건조한 애로 표현이 되는데요.  이때 `as_user=True` 인자를 주게된다면 봇 등록할때 설정했던 프로필로써 표현됩니다.

![slack-bot-user](https://cloud.githubusercontent.com/assets/4270075/17458224/2d92fc68-5c46-11e6-8de7-7ec706dc83f9.png){: .center-image}

제일 처음 이미지에서 공지 봇에서 본거와 같이 **Message Formatting**을 하고 싶다면 다음과 같이 `attachments`인자를 채워주면 됩니다.
{% highlight python %}
attachments_dict = dict()
attachments_dict['pretext'] = "attachments 블록 전에 나타나는 text"
attachments_dict['title'] = "다른 텍스트 보다 크고 볼드되어서 보이는 title"
attachments_dict['title_link'] = "https://corikachu.github.io"
attachments_dict['fallback'] = "클라이언트에서 노티피케이션에 보이는 텍스트 입니다. attachment 블록에는 나타나지 않습니다"
attachments_dict['text'] = "본문 텍스트! 5줄이 넘어가면 *show more*로 보이게 됩니다."
attachments_dict['mrkdwn_in'] = ["text", "pretext"]  # 마크다운을 적용시킬 인자들을 선택합니다.
attachments = [attachments_dict]

slack.chat.post_message(channel="#channel", text=None, attachments=attachments, as_user=True)
{% endhighlight %}

결과는 다음과 같습니다.

![slack-bot-attachments-message](https://cloud.githubusercontent.com/assets/4270075/17458457/1b13aec4-5c4c-11e6-87d4-684b1aa9774c.png){: .center-image}


## RTM을 이용한 메세지 주고 받기

메세지는 [Real Time Message API][real-time-api]를 통해서 주고 받을 수 있습니다. Websocket이 필요하므로 [websocket-client][websocket-client]를 사용하겠습니다.


### 메세지 받기
{% highlight python %}
import websocket

response = slack.rtm.start()
sock_endpoint = response.body['url']
slack_socket = websocket.create_connection(endpoint)

slack_socket.recv()
{% endhighlight %}

### 메세지 보내기
{% highlight python %}
import json
message_dict = {'id': '1', 'type': 'message', 'channel': 'C024BE91L', 'text': 'Hello, World!'}

slack_socket.send(json.dumps(message_dict))
{% endhighlight %}

## 비동기 사용하기
소켓으로 recv()를 호출했을때 기본적으로는 blocking 모드로 동작합니다. 이는 소켓 버퍼에서 읽을 데이터가 없으면 새로운 데이터가 들어올때까지 다음 코드로 진행하지 않는 다는 것을 뜻합니다. 

## 더 자세한 기능은?
[slacker github 페이지][slacker]의 documentation은 단 한줄 적혀있습니다. [https://api.slack.com/methods][https://api.slack.com/methods]. 슬랙 API 페이지를 걸어둔 것이야 말로 슬랙에서 지원하는 API처럼 맞춰서 구현했다는 자신감 아닐까 생각해봅니다. 



[slack]: https://slack.com/
[api-docs-community]: https://api.slack.com/community/
[slacker]: https://github.com/os/slacker/
[slack-api]: https://api.slack.com/
[slack-app]: https://slack.com/apps/
[real-time-api]: https://api.slack.com/rtm
[websocket-client]: https://github.com/liris/websocket-client
