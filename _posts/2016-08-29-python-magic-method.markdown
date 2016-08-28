---
layout: post
title: "파이썬 더블 언더스코어: Magic Method"
excerpt: "파이썬에서 __를 달고있는 메소드들에 대해서 살펴봅시다."
date: 2016-08-29 08:00:00 +0900
categories: [Python]
modified: 2016-08-29
last_modified_at: 2016-08-29
comments: true
tags: [python, magic, method, 파이썬, 매직, 메소드]
---

Pycon APAC 2016에서는 키스톤 후원사인 카카오에서 [가위바위보 코딩배틀][tech-kakao-rsp]를 진행했습니다. 가위바위보 파이썬 프로그램을 만들어서 상대를 더 많이 이기면 되는 간단하지만 심오한 게임이었습니다. 가위바위보 코딩배틀의 [후기][tech-kakao-after]를 보면서 어뷰징 부분에 눈길이 갔습니다. 더블 언더스코어 형태의 [특별한 메소드][python-reference-data-model]을 재정의해서 상대방의 패를 보거나, 모듈을 바꿔치기해서 항상 이길 수 있게 하더군요. 코드를 보면서 대략적으로만 알고만 있었던 더블 언더스코어 메소드와 속성을 이번 기회에 정리해보고자 마음먹었습니다.

## 더블 언더스코어의 마법
파이썬은 **객체 지향 언어**입니다. 파이썬에서 모든 데이터들은 객체로 표현되거나 객체 사이의 관계로 표현됩니다. 여기서 미리 정의되어 있는 특별한 이름을 가진 메소드들을 재정의 함으로써 파이썬 인터프리터가 데이터 객체를 만들거나, 표현하거나, 연산을 하는데 도움을 줄 수 있습니다. 여러가지 **Built-in 함수**들이 처리할 연산을 정의함으로써, 동작이 마법과 같이 뾰로롱 처리한다고 해서 **매직 메소드(Magic Method)**라는 이름이 붙었고, 파이썬에서는 문서에서는 [특별 메소드(Special method)][python-reference-data-model]라고 적혀있습니다. 언더스코어(_)가 두개가 붙는게 특징이기 때문에 **D**ouble **UNDER**score Method를 줄여서 [던더(DUNDER) 메소드][dunder-method]라고 부르기도 합니다.

## 1. 매직 메소드 다루기 - 객체

**python 3** 버전의 레퍼런스를 기준으로 하고있습니다.

### 1.1 객체의 생성과 초기화

 * `__new__(cls[, ...])`: 새로운 인스턴스를 만들때 제일 **처음**으로 실행되는 메소드입니다. 새로운 `object`를 반환해줘야 합니다. 

 * `__init__(self[, ...])`: 인스턴스가 `__new__`로 생성되고 나서 호출되는 메소드입니다. 인자를 받아서 내부에 지정해 줄 수 있습니다.

 * `__del__(self)`: 객체의 **소멸**에 될때 해야할 일을 지정할 수 있습니다. `del`키워드를 호출한다고 해서 `__del__()`이 바로 호출되지는 않습니다. 내부에 있는 레퍼런스 카운터가 0가 되면 소멸합니다. 객체 소멸시 파일을 닫아준다거나 할때 사용할 수 있습니다.

예제와 함께 봅시다. 아래 예제는 NumBox라는 클래스를 만드는데 `__new__`를 통해서 인자가 하나도 들어오지 않을 경우는 객체를 생성하지 않고 None으로 반환합니다. 그리고 `__init__`를 재정의해서 클래스의 변수인 `num`을 초기화 시킵니다.

{% highlight python %}
class NumBox:
    def __new__(cls, *args, **kwargs):
        if len(args) < 1:  # 인자가 들어오지 않은 경우
            return None  # None을 반환
        else:  # 인자가 들어온 경우
            return super(NumBox, cls).__new__(cls)  # object를 반환

    def __init__(self, num=None):
        self.num = num  # 받은 인자 num을 인스턴스 변수로 지정

    def __repr__(self):
        return str(self.num)
{% endhighlight %}

아래는 실행 결과 입니다.
{% highlight python %}
In [1]: a = NumBox()  # 인자가 없이 객체 생성

In [2]: type(a)
Out[2]: NoneType

In [3]: b = NumBox(10)  # 인자를 받으면서 객체 생성

In [4]: b
Out[4]: 10

In [5]: type(b)
Out[5]: __main__.NumBox 
{% endhighlight %}

`__new__`는 인스턴스 초기 생성에 관련되어 있기 때문에 초기값을 조작하거나, 싱글톤 패턴을 만들때 사용할 수 있습니다. 어떤 식으로 싱글톤을 만드는지는 [레퍼런스][new-keyword-reference]에서 확인하세요.


### 1.2 객체의 표현

 * `__repr__(self)`: 객체를 나타내는 **공식적인** 문자열입니다. `repr()`로 호출 할 수 있습니다. 가능하다면 여기 표현된 값으로 같은 객체를 만들 수 있어야 합니다. `eval(repr(object))`를 했을때 객체를 생성할 수 있는 형태로요. 그렇지 못할 경우 유용한 정보를 나타내야합니다. 반환값의 타입은 `string`이어야 합니다. `__str__`하고 달리 좀 더 명확함을 지향하고 있는 느낌입니다. 

 * `__str__(self)`: 객체를 나타내는 비공식적인 문자열이지만 객체를 이해하기 쉽게 표현할 수 있는 문자열입니다.`__repr__`보다 사용자에게 보기 쉬운 문자열을 출력하는 것에 지향점이 있습니다. `str()`로 호출 할 수 있습니다. 마찬가지로 `string`타입의 문자열을 반환해야 합니다. `__repr__()`만 구현되어있고 `__str__()`이 구현되어 있지 않은 경우에는 str()이 `__repr__()`을 불러오게 됩니다.

 * `__bytes__(self)`: 객체를 나타내는 byte 문자열입니다. `bytes()`로 호출 할 수 있습니다. 

 * `__format__(self)`: 객체를 나타내는 format을 지정하고 싶을때 사용합니다.

예제와 함께 봅시다. StrBox라는 클래스에 인자로 문자열을 받습니다.

{% highlight python %}
class StrBox:
    def __init__(self, string): 
        self.string = string
    
    def __repr__(self):
        return "A('{}')".format(self.string)

    def __bytes__(self):
        return str.encode(self.string)

    def __format__(self, format):
        if format == 'this-string':
            return "This string: {}".format(self.string)
        return self.string
{% endhighlight %}

실행 결과입니다. 각각 `__str__()`은 정의되어 있지 않지만 `__repr__()`을 대신 출력합니다. `eval()`의 인자로 `repr(obj)`을 줌으로서 같은 객체를 만들 수도 있습니다.

{% highlight python %}
In [1]: a = StrBox('Life is short, you need python')

In [2]: a
Out[2]: A('Life is short, you need python')

In [3]: repr(a)
Out[3]: "A('Life is short, you need python')"

In [4]: str(a)
Out[4]: "A('Life is short, you need python')"

In [5]: bytes(a)
Out[5]: b'Life is short, you need python'

In [6]: "{:this-string}".format(a)
Out[6]: 'This string: Life is short, you need python'

In [7]: eval(repr(a))
Out[7]: A("Life is short, you need python")
{% endhighlight %}


### 1.3 속성 관리

 * `__getattr__(self, name)`: 객체의 **없는** 속성을 참조하려 할때 호출됩니다. 일반적으로 찾는 속성이 있다면 호출되지 **않습니다.** `__getattr__`은 인스턴스의 다른 속성에는 접근 할 수 없도록 설계 되어있습니다.

 * `__getattribute__(self, name)`: 객체의 속성을 호출할때 무조건 호출됩니다. 만약 이 메소드가 재정의 되어있다면 `__getattr__`는 호출되지 않으므로 명시적으로 호출해야하거나 `AttributeError`에러를 발생시켜야합니다. 

 * `__setattr__(self, name, value)`: 객체의 속성을 변경할때 호출됩니다. 주의해야 하는 것은 여기서 다시 객체의 속성을 변경하지 않아야 한다는 것입니다. 재귀적으로 계속 호출함으로써 무한루프에 빠집니다.

 * `__delattr__(self, name)`: 객체의 속성을 `del`키워드로 지울 때 호출됩니다.

 * `__dir__(self)`: 객체가 가지고 있는 모든 속성들을 보여주는 `dir()`을 사용할때 호출됩니다.

  * `__slots__`: 사용할 변수의 이름을 미리 지정할 수 있습니다. 인스턴스 변수 시퀀스와 각 인스턴스별로 각 변수들에 값을 넣어둘 충분한 공간을 준비해둡니다. 다른 이름을 가진 변수는 허용되지 않습니다. `__dict__`를 미리 만들지 않으므로 공간을 절약할 수 있습니다.

{% highlight python %}
class NameBox:

    person_name = "wonkyun"
    def __getattr__(self, name):
        print("Not Found: {}".format(name))

    def __setattr__(self, name, value):        
        print("Set attribute: {} is {}".format(name, value))
        self.person_name = value  # 재귀적으로 호출되어 문제가 있는 부분
{% endhighlight %}

{% highlight python %}
In [1]: box = NameBox()

In [2]: box.person_name
Out[2]: "wonkyun"

In [3]: box.name
Out[3]: Not Found: name

In [4]: box.person_name = "Ho!"
Out[4]: Set attribute: person_name is Ho!
        Set attribute: person_name is Ho!
        Set attribute: person_name is Ho!
        ...
{% endhighlight %}


### 1.4 Descriptors 관리

`Descriptor`는 `__get__()`, `__set__()`, `__delete__()` 메소드로 구성된 프로토콜을 구현한 클래스입니다. 여러 속성에 대한 동일한 접근 논리를 재사용 할 수 있게 도와줍니다.

 * `__get__(self, instance, owner)`: 특정 오브젝트의 값을 참조할때 호출됩니다.

 * `__set__(self, instance, value)`: 특정 오브젝트의 값을 변경할때 호출됩니다.

 * `__delete__(self, instance)`: 특정 오브젝트의 값을 삭제할때 호출됩니다.

아래는 Descriptor에 대한 에제입니다. `Rating`클래스는 `__set__`과 `__get__` 프로토콜이 구성된 디스크립터 클래스입니다. `MovieReview`는 `Rating()`을 가지고 있는 관리 대상 클래스입니다. 변수 `story`, `acting`, `fun`은 모두 `Rating`의 0~5 사이 정수만 받을 수 있다는 규칙을 따르고 있습니다. 파이썬 Descriptor 관한 추가적인 설명은 [레퍼런스][descriptor]를 참고하세요.

{% highlight python %}
class Rating():
    def __init__(self, rating=3):
        self.rating = rating

    def __set__(self, instance, value):
        if value < 0 or value > 5:
            raise ValueError('rating must be 0~5')
        else:
            setattr(instance, 'rating', value)

    def __get__(self, instance, owner):
        return getattr(instance, 'rating')

class MovieReview():
    story = Rating()
    acting = Rating()
    fun = Rating()
{% endhighlight %}

{% highlight python %}
In [1]: a = MovieReview()

In [2]: a.story = 10
Out[2]: ValueError: rating must be 0~5

In [3]: a.acting = 2

In [4]: a.acting
Out[4]: 2
{% endhighlight %}


### 1.5 컨테이너 관리: 콜렉션과 반복

컨테이너는 list와 tuple같은 시퀀스와 dictionary같은 맵핑을 뜻합니다.

 * `__len__(self)`: 객체의 길이를 반환합니다. 길이는 0이상인 정수 입니다. `len()`으로 호출됩니다.

 * `__length_hint__(self)`: 객체의 대략적으로 측정된 길이를 반환합니다. `operator.length_hint()`으로 호출 됩니다.

 * `__getitem__(self, key)`: 객체에서 [] 연산자를 사용하여 조회할때 동작을 정의합니다. 예를들어 `_list[10]`은 `_list.__getitem__(10)`으로 동작합니다. 키의 타입이 적절하지 않다면 `TypeError`에러를, 키가 인덱스를 벗어났을 경우는 `IndexError`를 던져야 합니다.

 * `__missing__(self, key)`: 키가 dictionary에 없을 경우 호출됩니다.

 * `__setitem__(self, key, value)`: 객체에서 [] 연산자를 사용해서 변수를 지정할때 동작을 정의합니다. 예를들어 `_list[10] = 1`은 `_list.__setitme__(10, 1)`으로 동작합니다.

 * `__delitem__(self, key)`: `del object[]`를 사용하는 경우 동작을 정의합니다.

 * `__iter__(self)`: 컨테이너의 `iterator`를 반환합니다.

 * `__reversed__(self)`: 순서가 반대로 바뀌는 함수인 `reversed()`로 호출됩니다.

 * `__contains__(self, item)`: `item`이 존재 한다면 True, 그렇지 않으면 False를 반환하는 메소드를 정의합니다. `__contains__`가 정의되어 있지 않다면 `__iter__`를 통해 이터레이션을 돌며 확인을 시도합니다.


### 1.6 나머지 클래스 서비스들

 * `__prepare__(metacls, name, bases, **kwds)`: 메타 클래스 네임스페이스에 대한 dictionary를 만듭니다. 메타 클래스가 이 속성이 없다면 빈 `dict()`로 초기화 됩니다.

 * `__instancecheck__(self, instance)`: 클래스의 인스턴스이면 참을 반환 해야합니다. `isinstance(instance, class)`로 호출됩니다.

 * `__subclasscheck__(self, subclass)`: 클래스의 서브클래스라면 참을 반환 해야합니다. `issubclass(subclass, class)`로 호출 됩니다.


## 2. 매직 메소드 다루기 - 연산

객체들과의 계산에 기본 연산자를 사용해서 계산하기 위해서 사용하는 재정의하는 메소드들입니다.

### 2.1 단항 연산자

 * `__neg__(self)`: `-object`를 정의합니다.

 * `__pos__(self)`: `+object`를 정의합니다.

 * `__abs__(self)`: `abs()`를 정의합니다.

 * `__invert__(self)`: 비트 연산 `~object`를 정의합니다.

### 2.2 비교 연산자

 * `__lt__(self, other)`: x < y를 정의합니다.

 * `__le__(self, other)`: x <= y를 정의합니다.

 * `__gt__(self, other)`: x > y를 정의합니다.

 * `__ge__(self, other)`: x >= y를 정의합니다.

 * `__eq__(self, other)`: x == y를 정의합니다.

 * `__ne__(self, other)`: x != y를 정의합니다.

예제로 봅시다. 다음은 **문자열의 길이**에 따라 비교 연산을 할 수 있는 `StrBox`클래스 입니다. 두 `StrBox`타입의 객체끼리 연산이 가능해집니다. `str`를 상속받았기 때문에 `str`타입 이랑도 비교가 가능합니다. 참고로 `str`이랑 `StrBox`랑 비교를 하면 연산자는 하위 클래스 `StrBox`에 정의된 것으로 동작합니다.

{% highlight python %}
class StrBox(str):
    def __new__(cls, string):
        return str.__new__(cls, string)
    def __lt__(self, other):
        return len(self) < len(other)
    def __le__(self, other):
        return len(self) <= len(other)
    def __gt__(self, other):
        return len(self) > len(other)
    def __ge__(self, other):
        return len(self) >= len(other)
    def __eq__(self, other):
        return len(self) == len(other)
    def __ne__(self, other):
        return len(self) != len(other)
{% endhighlight %}


### 2.3 산술 연산자

산술 연산자는 시작하기전에 예시를 먼저 들겠습니다. `__add__`는 + 연산에 대해서 정의 할 수 있습니다.

{% highlight python %}
class NumBox:
    def __init__(self, num):
        self.number = num

    def __add__(self, num):
        return NumBox(self.number + num)
{% endhighlight %}

다음 코드로 `a = NumBox(10)`으로 인스턴스화 시킨다음 `a + 10`을 연산하면 결과가 **20**이 됩니다. 그러나 **`10 + a`**를 하면 어떻게 될까요?

{% highlight python %}
---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-257-2acbf4d1b3b2> in <module>()
----> 1 10 + a

TypeError: unsupported operand type(s) for +: 'int' and 'NumBox'
{% endhighlight %}

역순 연산자에 대해서 지원하지 *않는* 것을 확인 할 수 있습니다. 마찬가지로 복합 할당 연산자 `+=`에 대해서도 제대로 동작하지 않습니다. 이를 지원하기 위해서는 앞에 *r(reverse 또는 righthand)*이 붙은 `__radd__`를 통해서 역순 연산자에 대해서 정의하고 *i(in-place)*가 붙은 `__iadd__`를 정의함으로써 `+=`를 지원 할 수 있습니다. 마찬가지로 다음 나오는 연산자에 앞에 `r`이 붙이면 역순 연산자이고 `i`가 붙으면 복합 할당 연산자입니다.

 * `__add__(self, other)`: x + y 연산을 정의합니다. `__radd__`는 역순 연산자, `__iadd__`는 복합 할당 연산자 입니다.

 * `__sub__(self, other)`: x - y 연산을 정의합니다. `__rsub__`는 역순 연산자, `__isub__`는 복합 할당 연산자 입니다.

 * `__mul__(self, other)`: x * y 연산을 정의합니다. `__rmul__`는 역순 연산자, `__imul__`는 복합 할당 연산자 입니다.

 * `__matmul__(self, other)`: x @ y 연산을 정의합니다. `__rmatmul__`는 역순 연산자, `__imatmul__`는 복합 할당 연산자 입니다. @는 파이썬 3.5에 추가된 행렬의 내적을 위한 중위 연산자 입니다.

 * `__truediv__(self, other)`: x / y 연산을 정의합니다. `__rtruediv__`는 역순 연산자, `__itruediv__`는 복합 할당 연산자 입니다.

 * `__floordiv__(self, other)`: x // y 연산을 정의합니다. `__rfloordiv__`는 역순 연산자, `__ifloordiv__`는 복합 할당 연산자 입니다.

 * `__mod__(self, other)`: x % y 연산을 정의합니다. `__rmod__`는 역순 연산자, `__imod__`는 복합 할당 연산자 입니다.

 * `__divmod__(self, other)`: `divmod()`를 통해 호출되는 연산을 정의합니다.

 * `__pow__(self, other[, modulo])`: x ** y 연산을 정의합니다. `pow()`를 통해서 호출 할 수도 있습니다.

 * `__round__(self[, n])`: 반올림 함수 `round()`를 통해 호출되는 연산을 정의합니다.


### 2.4 비트 연산자와 논리 연산자

 * `__lshift__(self, other)`: x << y 시프트 연산을 정의합니다. `__rlshift__`는 역순 연산자, `__ilshift__`는 복합 할당 연산자 입니다.

 * `__rshift__(self, other)`: x >> y 시프트 연산을 정의합니다. `__rrshift__`는 역순 연산자, `__irshift__`는 복합 할당 연산자 입니다.

 * `__and__(self, other)`: x & y 연산을 정의합니다. `__rand__`는 역순 연산자, `__iand__`는 복합 할당 연산자 입니다.

 * `__or__(self, other)`: x &#124; y 연산을 정의합니다. `__ror__`는 역순 연산자, `__ior__`는 복합 할당 연산자 입니다.

 * `__xor__(self, other)`: x ^ y 연산을 정의합니다. `__rxor__`는 역순 연산자, `__ixor__`는 복합 할당 연산자 입니다.


### 2.5 타입 변환

 * `__int__(self)`: 정수 변환 함수 `int()`를 통해 호출되는 연산을 정의합니다.

 * `__float__(self)`: 실수 변환 함수 `float()`를 통해 호출되는 연산을 정의합니다. 

 * `__complex__(self)`: 복소수 변환 함수 `complex()`를 통해 호출되는 연산을 정의합니다.

 * `__bool__(self)`: 진리값 테스트 `bool()`을 통해 호출되는 연산을 정의합니다. `True`나 `False`를 반환해야 합니다. 만약 이 메소드가 정의되어있지 않을 경우 `__len__`을 대신 호출합니다.

 * `__hash__(self)`: `hash()`를 통해 호출되는 연산을 정의합니다. 정수를 반환해야 합니다.

 * `__index__(self)`: slice expression에 객체가 사용될때 사용할 정수 형태를 정의합니다. 

아래는 `__index__`에 관한 예제입니다. 리스트를 가져오는데 객체를 넣어서 가져올 수 있습니다.

{% highlight python %}
class Slice:
    def __index__(self):
        return 1
{% endhighlight %}

{% highlight python %}
In [1]: slice = Slice()

In [2]: _list = ["123", "456", "789"]

In [3]: _list[slice]
Out[3]: '456'
{% endhighlight %}


## 3. 매직 메소드 다루기 - 컨텍스트 매니저

`with`키워드를 통해서 블럭에 진입할 때, 컨텍스트 매니저를 통해서 시작과 끝에 할 일을 처리할 수 있습니다.

 * `__enter__(self)`: `with`로 블럭에 진입할 때 해야할 일을 정합니다.

 * `__exit__(self, exc_type, exc_value, traceback)`: 블럭이 끝날때 해야할 일을 정합니다. exception이 발생한 경우에도 호출합니다. 정상적인 경우로 종료되었다면 `exc_type`, `exc_value`, `traceback`은 `None`로 들어옵니다.

다음 예제는 socket을 자동으로 닫아주는 `SocketWrapper`입니다. `with SocketWrapper() as so`와 같은 코드로 사용가능하며 `with`블럭이 끝나면 자동으로 `__exit__`를 호출해서 소켓 연결을 닫습니다.

{% highlight python %}
import socket

class SocketWrapper:
    def __init__(self):
        self.so = socket.socket(socket.AF_INET, socket.SOCK_STREAM)  # 새로운 소켓을 생성

    def __enter__(self):
        self.so.connect(('localhost', 8888))  # 소켓을 connect 하고
        return self.so  # 반환한다

    def __exit__(self, exception_type, exception_val, trace):
        try:
            self.so.close()  # with구문이 끝나면 소켓을 닫는다
        except socekt.error as msg:
            print(msg)
{% endhighlight %}


## 4. 매직 메소드 다루기 - 비동기 

비동기랑 관련된 매직 메소드입니다. 파이썬 3.5에 추가되었습니다.

 * `__await__(self)`: `await`표현을 사용할 수 있는*(awaitable이라 합니다)* 객체를 만드는데 사용합니다. `iterator`를 반환해야 합니다.

 * `__aiter__(self)`: 비동기를 위한 `__iter__`입니다. 비동기 `iterator` 반환해야 합니다.

 * `__anext__(self)`: 비동기를 위한 `__next__`입니다. *awaitable*한 결과를 반환해야 합니다. 이터레이션이 끝나면 `StopAsyncIteration`에러를 던집니다.

 * `__aenter__(self)`: 비동기 컨텍스트 매니저를 위한 메소드 입니다. `__enter__`랑 같습니다. *awaitable*객체를 반환해야 합니다.

 * `__aexit__(self, exc_type, exc_value, traceback)`: 비동기 컨텍스트 매니저를 위한 메소드 입니다. `__exit__`랑 같습니다. *awaitable*객체를 반환해야 합니다.

예제로 보겠습니다. 파이썬 3.4에 추가된 비동기 라이브러리인 `asyncio`를 통해서 비동기로 실행시킵니다.

{% highlight python %}
import asyncio

class AsyncIterator:
    def __init__(self, obj):
        self.obj = obj

    async def __aiter__(self):
        return self

    async def __anext__(self):
        try:
            return next(self.obj)
        except StopIteration:  # 이터레이션이 끝일 경우
            raise StopAsyncIteration


async def example():
    _map = map(lambda x: x * 2, [1, 2, 3])
    _iter = AsyncIterator(_map)
    async for x in _iter:
        print(x, end= ' ')

loop = asyncio.get_event_loop()
loop.run_until_complete(example())

Out[1]: 2 4 6
{% endhighlight %}


[tech-kakao-rsp]: http://tech.kakao.com/pycon2016apac/
[tech-kakao-after]: http://tech.kakao.com/2016/08/19/gawibawibo/
[python-reference-data-model]: https://docs.python.org/3/reference/datamodel.html#special-method-names
[dunder-method]: https://wiki.python.org/moin/DunderAlias
[new-keyword-reference]: https://www.python.org/download/releases/2.2.3/descrintro/#__new__
[descriptor]: https://docs.python.org/3/howto/descriptor.html

