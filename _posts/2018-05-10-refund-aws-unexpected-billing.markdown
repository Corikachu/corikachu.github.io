---
layout: post
title: "AWS에서 맞은 요금 폭탄 해결기"
excerpt: "요금 페이지를 잘못 읽고 난 후 나온 $890. 부끄러운 실수 회고록."
date: 2018-05-10 08:00:00 +0900
categories: [aws]
modified: 2018-05-10
last_modified_at: 2018-05-10
comments: true
tags: [aws, 요금]
---
데이터 분석 도중 로컬 컴퓨터에서 무리가 있다고 생각해서 AWS에 컴퓨팅파워가 쓸만한 서버를 하나 구축하려 했습니다. [아마존 머신 이미지(AMI)][aws_ami]로 미리 셋팅된 서버를 간편하게 올리고, AWS의 요금체계를 확인하며 인스턴스는 [spot instance][aws_spot_instance]로 비용을 절감하고자 했습니다. 만약 spot instance가 도중에 중단되더라도 작업 결과물을 잃지 않게 셋팅했고, [boto3][aws_boto]으로 중단된 spot instance를 편하게 재시작 할 수 있도록 자동화하는 코드를 만들었습니다. 문제는 [EBS의 요금][aws_ebs] 페이지에서 일어납니다. 프로비저닝된 iops 볼륨(io1)에 대한 과금 설명을 제가 잘못 읽고 맙니다.


## 문제의 문장

> Additionally, you provision 1000 IOPS for your volume. In a region that charges $0.065 per provisioned IOPS-month, you would be charged $1.083 for the IOPS that you provisioned ($0.065 per provisioned IOPS-month * 1000 IOPS provisioned * 43,200 seconds /(86,400 seconds /day * 30 day-month)).

이 문장은 io1의 IOPS를 1000으로 설정해 둘 경우 $0.065 IOPS-month의 과금 기준을 가진 리전에서 30일이 마지막인 달에서 **총 12시간**을 쓸 때 $1.083만큼 나온다는 이야깁니다. _( 1000 IOPS \* 0.065 IOPS-month \* ( 0.5 day / 30 day))_ 저는 이 문장을 30일인 달에 **하루 12시간씩** 켠다면 나오는 과금으로 이해해버리고 맙니다. 슬쩍 보고 "하루 12시간씩 써도 $1.083이면 펑펑써도 얼마 안 나오겠네!"하고 생각해버리고 자동화하는 코드에 다음과 같이 쓰고 맙니다.

```python
spot_instance_res = ec2_res.create_instances(
    BlockDeviceMappings=[{
      'Ebs': {
        'VolumeType': 'io1'
        'Iops': 5000,
      },},
    ],
)
```

iops를 5000으로 잡고 io1을 켜버린 것이지요. 이렇게 되면 한달이 30일인 기준으로 $0.067 IOPS-month인 서울 리전으로 과금을 계산해보면 한달에 $335가 나옵니다. 2개 켜두면 $670입니다. 결국 아래 billing과 같이 메일이 오면서 사태를 깨닫고 맙니다.

![billing](https://user-images.githubusercontent.com/4270075/39854506-f0d7ddcc-5462-11e8-987d-699fbec1e363.png){: .center-image}

## 도와주세요
한번은 AWS가 감면해준다는 여러 글들을 읽고, AWS Support Center에 도움을 받을 수 있는지 물어봤습니다.

> **나:** EBS 요금 정책을 잘못 읽었고 예상하지 못한 과금이 나왔어... 그런데 내가 학생이라 이걸 다 내기엔 무리가 있는 것 같아. 좀 도와줄 수 있을까?  
> **AWS:** 우리가 도와줄 수 있을 것 같은데. 그렇지만 우선 이 같은 일이 다신 일어나서는 안 돼. EBS 요금 정책을 살펴보고 과금이 많이 되는 EBS 볼륨을 종료시키고 연락해줘.  
> **나:** 서포트 요청할 때 EBS 볼륨 종료시켰어. EBS 요금 정책을 잘못 본건 내 잘못이야. 그래도 이번 달 요금에 대해서 도움을 좀 받고 싶어.  
> **AWS:** 좋아! 지난달 과금 다 환불해 줄게. 그리고 추가로 75$ 크레딧 줄게. 4일정도 추가로 나온거에 적용될거야.  
> **나:** 헐 감사합니다. 다음부턴 더 주의할게.

6일 뒤에 해외결제가 취소되었다는 카드사 SMS를 받고 나서야 안도했습니다. 바보같이 생돈 나갈 일이 나에게 일어날 줄 몰랐지만, AWS의 넓은 아량으로 살았습니다. 개인의 실수고 돈과 관련있는 일이었지만 한번은 봐준다는 것이 신기하고 오묘한 느낌입니다. 앞으로 도큐먼트의 중요한 내용은 꼼꼼히 확인해봐야겠습니다. 그리고 영어 공부를 좀 더 해야겠습니다. -_-


[aws_ami]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AMIs.html
[aws_spot_instance]: https://aws.amazon.com/ec2/spot/getting-started/
[aws_boto]: https://boto3.readthedocs.io/
[aws_ebs]: https://aws.amazon.com/ebs/pricing/
