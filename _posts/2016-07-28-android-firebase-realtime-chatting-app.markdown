---
layout: post
title: "[Android] Firebase의 Realtime Database로 간단한 채팅 앱 만들기"
excerpt: "Firebase의 Realtime Database로 채팅 어플리케이션을 만들어 봅시다."
date: 2016-07-28 01:00:00 +0900
categories: [android, firebase]
modified: 2016-08-08 
last_modified_at: 2016-08-08 
comments: true
image:
  feature: https://cloud.githubusercontent.com/assets/4270075/17187728/65dc1042-5475-11e6-8b48-8b8be027f6a4.png
  widht: 500
  height: 256
redirect_from:
  - /articles/2016-07/android-firebase-realtime-chatting-app
---

안드로이드 강의를 준비하면서 웹을 서핑하다 Firebase를 우연히 다시 보게 되었습니다. Google I/O 2016에서도 많이 강조되기도 한 Firebase는 개인적으로 예전 [채팅 SDK를 만드는 회사][sendbird]에 다닐때 채팅을 만들 수 있는 툴 중 하나로 알고만 있었는데요. 그때 Realtime database를 써보자 써보자 말만 해두고 막상 써본일이 없었는데 이번 기회에 채팅앱을 만들어 보자! 하면서 사용해 보았습니다.


## Firebase의 Realtime Database
Firebase의 Realtime Database는 NoSQL기반 cloud-hosted database입니다. 실시간으로 모든 클라이언트에서 데이터가 동기화 되고, 앱이 오프라인 상태라도 계속 사용할 수 있습니다. Data는 Json tree 형태로 저장이 됩니다. 


#### 만들 앱의 Preview
![preview](https://cloud.githubusercontent.com/assets/4270075/17188932/40259422-547a-11e6-904f-1bdb91f9112b.png){: .center-image}

#### 환경
* Android Studio & Gradle: 2.1.2
* Firebase: 9.2.1
* google-services: 3.0.0

## Firebase 프로젝트 생성하기
[Firebase 홈페이지][firebase]에서 Get Started With Free를 클릭해서 Firebase 프로젝트를 만들 수 있는 곳으로 옵니다. 프로젝트 만들기로 프로젝트 이름을 넣고 프로젝트를 생성합니다.

프로젝트를 만들고나서 `Android 앱에 Firebase를 추가`를 클릭해서 다음과 같은 창을 띄웁니다. 저는 패키지 이름을 `com.testproject.corikachu`로 설정하고 안드로이드 앱을 `Firebasetest`로 만들었습니다. 디버그 서명 인증서는 그냥 두고 진행하셔도 됩니다.  
  
![first-setting](https://cloud.githubusercontent.com/assets/4270075/17189387/25e2ea40-547c-11e6-9633-ee0884a893dd.png){: .center-image}


앱 추가를 클릭하고 `google-services.json`파일을 다운로드 받습니다. 그리고 Android Studio로 넘어와서  안드로이드 프로젝트를 생성해서 진행합니다. 등록한 패키지명과 같은 안드로이드 프로젝트를 생성한 후, app폴더 안에 다운로드 받은 `google-services.json` 파일을 넣어줍니다.

![project-structure](https://cloud.githubusercontent.com/assets/4270075/17187722/63004460-5475-11e6-806d-60f0b05b665e.png){: .center-image}

그런 다음 *Project*의 `build.gradle`에는 다음과 같이 추가합니다.
{% highlight java %}
...
dependencies {
    classpath 'com.google.gms:google-services:3.0.0'
}
...
{% endhighlight %}

*App*의 `build.gradle`파일에는 다음과 같이 추가합니다.
{% highlight java %}
apply plugin: 'com.google.gms.google-services'
...
dependencies {
    compile 'com.google.firebase:firebase-database:9.2.1'
}
...
{% endhighlight %}

실시간으로 네트워크 통신을 하기위해 `AndroidManifest.xml`에 인터넷 퍼미션을 추가합니다.
{% highlight java %}
<uses-permission android:name="android.permission.INTERNET" />
{% endhighlight %}

<br/>
모두 끝냈다면 다시 Firebase 싸이트로 돌아와서 `Rule`을 다음과 같이 수정해야합니다. 이는 Realtime Database에 접근하기 위한 권한을 설정하는 부분입니다. 기본적으로는 인증을 받고 접근하게 설정되있습니다만, 지금은 인증 과정을 다루지 않고 있으니 읽기와 쓰기 권한을 모두 `true`로 바꿔줍니다.
{% highlight json %}
{
  "rules": {
    ".read": "true",
    ".write": "true"
  }
}
{% endhighlight %}

## 안드로이드 코드 작성
xml 레이아웃 파일을 다루는 부분은 넘어가겠습니다. 제일 처음의 preview에서 보는 것과 같이 하나의 ListView와 EditText 그리고 Button으로 구성되어 있습니다. 

### 채팅을 데이터를 담을 DTO(Data Transfer Object)
데이터를 옮겨 담을 `ChatData 클래스`를 하나 만들겁니다. 유저의 이름과 채팅 메세지를 담을 수 있게 만듭니다. 이때 `빈 생성자`는 하나 꼭 만듭니다.
{% highlight java %}
public class ChatData {
    private String userName;
    private String message;
    
    public ChatData() { }

    public ChatData(String userName, String message) {
        this.userName = userName;
        this.message = message;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
{% endhighlight %}


### Firebase 연동
이제 실제로 Firebase를 연동해 볼 차례입니다. 우선 각 view들을 연결해줍니다.  

{% highlight java %}
listView = (ListView) findViewById(R.id.listView); 
editText = (EditText) findViewById(R.id.editText); 
sendButton = (Button) findViewById(R.id.button); 

userName = "user" + new Random().nextInt(10000);  // 랜덤한 유저 이름 설정 ex) user1234

// 기본 Text를 담을 수 있는 simple_list_item_1을 사용해서 ArrayAdapter를 만들고 listview에 설정 
adapter = new ArrayAdapter<>(this, android.R.layout.simple_list_item_1, android.R.id.text1); 
listView.setAdapter(adapter);
{% endhighlight %}

FireBase를 사용하기 위해서는 다음과 같은 코드를 추가합니다.
{% highlight java %}
private FirebaseDatabase firebaseDatabase = FirebaseDatabase.getInstance();
private DatabaseReference databaseReference = firebaseDatabase.getReference();
{% endhighlight %}

### Realtime Database 사용해서 채팅 보내기
{% highlight java %}
sendButton.setOnClickListener((view) -> {
    ChatData chatData = new ChatData(userName, editText.getText().toString());  // 유저 이름과 메세지로 chatData 만들기
    databaseReference.child("message").push().setValue(chatData);  // 기본 database 하위 message라는 child에 chatData를 list로 만들기
    editText.setText("");
});
{% endhighlight %}

`push()`는 리스트 형태로 데이터를 추가할 수 있게 해줍니다. Firebase에서 자동으로 unique key를 생성해줍니다. `setValue()`는 값을 database에 쓰거나 기존 데이터를 대체합니다.

### Realtime Database 사용해서 채팅 받기
{% highlight java %}
databaseReference.child("message").addChildEventListener(new ChildEventListener() {  // message는 child의 이벤트를 수신합니다.
    @Override
    public void onChildAdded(DataSnapshot dataSnapshot, String s) {
        ChatData chatData = dataSnapshot.getValue(ChatData.class);  // chatData를 가져오고
        adapter.add(chatData.getUserName() + ": " + chatData.getMessage());  // adapter에 추가합니다.
    }
    
    @Override
    public void onChildChanged(DataSnapshot dataSnapshot, String s) { }
    
    @Override
    public void onChildRemoved(DataSnapshot dataSnapshot) { }
    
    @Override
    public void onChildMoved(DataSnapshot dataSnapshot, String s) { }

    @Override
    public void onCancelled(DatabaseError databaseError) { }
});
{% endhighlight %}

DatabaseReference에 추가 할 수 있는 리스너는 두 종류가 있는데요. 하나는 `ValueEventListener`이고 다른 하나는 `ChildEventListener`입니다.

* `ValueEventListener`: database에서의 모든 change들을 감지합니다.
* `ChildEventListener`: Child에서 일어나는 change들을 감지합니다. 다음과 같은 메소드가 있습니다.
  * onChildAdded(): 리스트의 아이템을 검색하거나 아이템의 추가가 있을때 수신합니다.
  * onChildChanged(): 아이템의 변화가 있을때 수신합니다.
  * onChildRemoved(): 아이템이 삭제되었을때 수신합니다.
  * onChildMoved(): 순서가 있는 리스트에서 순서가 변경되었을때 수신합니다.

onChildAdded를 수정해서 다른 클라이언트에서 데이터가 추가될때 chatData를 가져오게 합니다. `dataSnapshot.getValue(ChatData.class)`로 데이터를 가져올 수 있습니다. 그 다음 Adapter에 추가해서 listview에 보여지게 합니다.

## 시연
![simulation-gif](https://cloud.githubusercontent.com/assets/4270075/17187712/5bf1c720-5475-11e6-9e89-71abdf654154.gif){: .center-image}
Firebase 콘솔과 같이 확인해 봤습니다. send버튼을 누를때마다 `message`라는 `child`에서 새로운 데이터가 추가되는 것을 볼 수 있습니다. 각각의 데이터 안에는 userName과 message가 들어있는 모습입니다.

## 정리
잠깐 사용하면서 본 Firebase Realtime Database의 장점을 다음과 같이 정리했습니다.

1. cloud-hosted database의 사용으로 개발 시간 단축
 - database가 실시간으로 연동된다는 것은 모바일 개발에 있어서 backend개발에 조금은 덜 집중해도 괜찮다는 이야기입니다. 따로 서버를 구축하지 않고 데이터베이스를 사용할 수 있다는 이점은 상당한 메리트로 다가옵니다.

2. Offline을 대비한 내부 캐시
 - 여기서는 Offline을 위한 설정을 다루지는 않았지만, 몇몇 설정을 통해 네트워크 연결이 불안정 했을때를 대비해서 내부 캐시에 데이터를 저장할 수 있습니다. 연결이 끊겼을때 수정된 데이터들을 큐에 저장해 두고 다시 연결 되었을때 동기화합니다.

3. 크로스 플랫폼 지원과 개발 환경의 통합
 - Android뿐만 아니라 iOS와 Web을 지원합니다. 또한 소개한 database의 기능 뿐만 아니라 Authentication이나 Crash Reporting같은 서비스가 하나의 SDK에서 가능하고, 모두 Firebase 콘솔에서 관리할 수 있습니다. 기능을 이리저리 조합해서 원하는 것을 쉽고 빠르게 만들 수 있다는 점이 마음에 듭니다.


<br/><br/>
PS: 글을 적어두고 올리기전에 얼마나 firebase에 관한 글이 많은지 확인하기위해 [GDG Korea Android][gdg-android-korea]에서 firebase로 검색을 했더니... 지금 이 글보다 더 잘되어 있는 [코드랩][firebase-codelab]이 있었습니다. 흑흑. 영어가 되는 사람은 코드랩으로 바로 가도 좋을 것 같습니다.


[sendbird]: https://sendbird.com/
[firebase]: https://firebase.google.com
[gdg-android-korea]: https://www.facebook.com/groups/gdg.korea.android/
[firebase-codelab]: https://codelabs.developers.google.com/codelabs/firebase-android/
