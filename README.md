# repeatable-promise
X
This module includes Promise based objects that provide ways to simplify asynchronous communication between different parts of a program and event triggering/handling.  At the core of these objects is  **Defer**,  a promise that can be resolved or failed from outside its body and can be used as a "remote switch".  **Cycle** is built on **Defer**, it is a  "retriggerable **Promise**".  These objects are very simple to use if one is a little familiar with **Promises** and leverage the clean call-back syntax of **Promises**.  The objects can easily be chained with regular **Promise**s, they are **Promise**s in their own right and most of their methods return **Promise**s. 

``Defer`` is a Promise that can be resolved remotely, e.g. outside of its body. It can be used for one time events.
``Cycle`` is  a Promise-like object that can be retriggered multiple times and remotely.
``Delay`` is a **Defer** that resolves itself after a set time.
``TimeOut`` is a **Defer** that fails after a set time.
``Queue`` is an object that queues/chains function calls or promise resolution 

Technically, the **Defer** object is a **Promise** that exposes its ```Resolve(v)``` and ```Reject(v)``` methods outside of its body.  The Cycle object wraps a series of **Defer** objects that are renewed with each retriggering. **Delay** and **TimeOut** are just a **Defer** with a timer.  And **Queue** is just  a wrapper around an extensible chain of ```Promise.then(...)``` calls.

Several methods of these two objects expose the underlying Promise object allowing the use of the Promise then-catch construct on them or to chain them with other promise objects.
## Contents
1. Defer
2. Delay
3. TimeOut
4. Cycle
5. Queue
6. Reference -> go here for details
7. Acknowlegment


# 1. Defer

## Usage

The syntax is simple and similar to that of a Promise.
The constructor has not argument:  ```new Defer()```

The key methods are :

```then(f)``` to define code to be executed asynchronously.

```resolve(v)``` to pass a value and trigger execution of the code.

note:```terminate(v)``` can also be used and is a synonym of ```resolve(v)```  



### Example 1

```
var rp = require("repeatable-promise")
var df = new rp.Defer() 
df.then((val)=>{console.debug("received",val)})
df.resolve(45)
```
#### Ouput
```
received 45
```

## Details

```then()``` returns a regular Promise and thus can bet chained with other  Promises
```
df
  .then((val)=>{console.debug("received",val)}
  .then(()=>{console.debug("something else")}
```

Since ```then(f)``` returns a promise, the ```catch(f)``` and ```finally(f)``constructs can also be used to handle errors.

The error case can be triggered  with ```reject(v)``` or its synonym ```fail(v)``` applied to the **Defer** object.

Please note that any **Defer** that is rejected needs a ```catch(f)``` clause otherwise a unhandled promise rejection error will be generatedé

### Example 2
```
var rp = require("repeatable-promise")
var df = new rp.Defer()

df.then((val)=>{console.debug("received",val)})
  .catch((val)=>{console.debug("failed",val)})
  .finally(()=>{console.debug("finally",)})
df.reject(99)
```
#### Output
```
failed 99
finally
```

# 2. Delay

**Delay** is a Promise that resolves itself after a delay. It is based on **Defer** and exposes the same methods as **Defer**.   The construtor accepts two parameters: the delay in milliseconds and an optional value passed at resolution.
If no value is not provided for the time delay or a **null** or **undefined** value is provided, the **Delay** behaves like a normal **Defer** and doesn't resolve by itself.

### Example 3

```
var rp = require("repeatable-promise")
var dl = new  rp.Delay(1000,222)

dl.then((val)=>{console.debug("received",val)})
  .catch((val)=>{console.debug("failed",val)})
  .finally(()=>{console.debug("finally",)})
```

#### Output
```
received 222
finally
```


# 3. TimeOut

**TimeOut**  is a Promise that fails itself after a delay. It is based on **Defer** and exposes the same methods as **Defer**.   The construtor accepts two parameters: the delay in milliseconds and an optional value passed at failure.
If no value is not provided for the time delay or a **null** or **undefined** value is provided,  the **TimeOut** behaves like a normal **Defer** and doesn't fail by itself.

### Example 4

```
var rp = require("repeatable-promise")
var dl = new  rp.TimeOut(1000,222)

dl.then((val)=>{console.debug("received",val)})
  .catch((val)=>{console.debug("failed",val)})
  .finally(()=>{console.debug("finally",)})
```

#### Output
```
failed 222
finally
```
# 4. Cycle


## Usage

The syntax is simple and mimicks that of a Promise

The constructor has no argument:  ```new Cycle()```

The key methods are :

```thenAgain(f)``` to define code to be executed asynchronously.

```repeat(v)``` to trigger to pass a value and execution of the code .


### Example 5

```
var rp = require("repeatable-promise")
var cy = new rp.Cycle() 
cy.thenAgain((val)=>{console.debug("received",val)})
cy.repeat(101)
cy.repeat(102)
cy.repeat(103)
```
#### Ouput
```
received 101
received 102
received 103
```

## Termination
### `terminate(val)`and `resolve(val)`

The ```thenAgain(func)``` method returns a Defer/Promise object. This object can be resolved by calling the either```terminate(val)```  or ```resolve(val)```  methods (the methods are synonymous). This resolution of the Defer/Promise stops all further triggering by the repeat function.  Other instances of the ```thenAgain(func)```  will continue to be triggered. 

### Example 6
```
var rp = require("repeatable-promise")
var cy = new rp.Cycle() 
var df = cy.thenAgain((val)=>{console.debug("received",val)}) 		// df is a Defer object.
df.then((val)=>{console.debug("the Defer is resolved with value",val)}) // to be excuted after resolution
cy.repeat(1)
setTimeout(
  ()=>{df.resolve(99) 								// the Defer is resolved
  cy.repeat(2)
  },100)
```
The timer is needed to ensure that ```cy.repeat(1)``` is fully executed before ```df.resolve(99)``` is executed. It is not necessary the case without the timer because ```cy.repeat(1)``` is executed asynchronously (see example 7 for behaviour without the timer). 

#### Output
```
received 1
the Defer is resolved with value 99
```


### terminate(val)

The Cycle object has also a ```terminate(val)``` method. This method disables the Cycle and all future calls to ```repeat(v)``` will be ignored.  Also, all Defer objects created with the ```thenAgain(func)```  will be resolved with the value passed to terminate.

Please note that a **Cycle** object is really a **Promise** (exactly a **Defer**  Promise) that is resolved when it is terminated; so one can use the **then** construct to execute a function just after a **Cycle** is terminated. 

It is recommend to terminate every Cycle that is created to avoid memory leaks; otherwise all the listening thenAgain will remain in memory. Only the Cycle needs to be terminated. 

### Example 7
```
var rp = require("repeatable-promise")
var cy = new rp.Cycle()
cy.then((val)=>{console.debug("the Cycle is terminated with value",val)}) 
var df = cy.thenAgain((val)=>{console.debug("received",val)}) // df is a Defer object.
df.then((val)=>{console.debug("the Defer is resolved with value",val)}) // to be excuted after resolution
cy.repeat(1)
cy.terminate(99) // the Cycle is terminated
cy.repeat(2)
```
A timer is not necessary as in example 6 because calls to  ```cy.repeat(val)``` and ```cy.terminate(val)``` are queued and are always executed asynchronoulsy but in the orders they were made.  

#### Output
```
received 1
the Cycle is terminated with value 99
the Defer is resolved with value 99
```


### Example 8 (complex)

```
var rp = require("repeatable-promise")
var timer
var cy =  new rp.Cycle()
var df1 = cy.thenAgain((val)=>{console.debug("1 received",val)})
df1.then((val)=>{console.debug("1 is terminated with value",val)})
var df2 = cy.thenAgain((val)=>{console.debug("2 received",val)})
df2.then((val)=>{console.debug("2 is terminated with value",val)})
var df3 = cy.thenAgain((val)=>{if(val>=3) {df1.resolve(100)}})
var df4 = cy.thenAgain((val)=>{if(val>=5) {
  cy.terminate(999)
  clearInterval(timer)
  }})

let n = 1
timer = setInterval(()=>{cy.repeat(n)
			n = n +1
			}
			,100)
```
#### Ouput
```
1 received 1
2 received 1
1 received 2
2 received 2
1 received 3
2 received 3
1 is terminated with value 100
2 received 4
2 received 5
2 is terminated with value 999
```

## Timing of execution

Calls to methods on a Cycle object can occurs asynchronously anywhere in the code where this Cycle object is available.
The only guarantee is that the execution of all ```cy.repeat(val)```, ```cy.terminate(val)``` and```cy.fail(val)``` calls will be queued and executed successively in the order they were made. A call to ```df.resolve(val)``` (where ```df = cy.thenAgain(f)```) is not queued and  ```cy.thenAgain(f)``` can be resolved/disabled before all pending values  from ```cy.repeat(val)``` are treated. 

### Example 9
```
var rp = require("repeatable-promise")
var cy = new rp.Cycle() 
var df = cy.thenAgain((val)=>{console.debug("received",val)}) 		// df is a Defer object.
df.then((val)=>{console.debug("the Defer is resolved with value",val)}) // to be excuted after resolution
cy.repeat(1)
df.resolve(99) 								// the Defer is resolved
cy.repeat(2)
```
#### Output
```
the Defer is resolved with value 99
```
Because ```cy.repeat(1)``` is queued and executed asynchronously, ```df ``` is resolved before the value ```1``` is treated and the value is ignored.

## Failure
### fail(val)

The ```fail(val)``` method of a Cycle object triggers the failure of all Defer objects derived from it with with ```thenAgain(f)```. Since these Defer objects are Promises, the failure can be caught with ``catch(f)```.
A call to ```fail(val)``` also  disables the Cycle and all future calls to ```repeat(v)``` will be ignored.  

### Example 10
```
var rp = require("repeatable-promise")
var cy1 = new rp.Cycle()

cy1.thenAgain((v)=>{console.debug("thenAgain1",v)})
  .then((v)=>{console.debug("then1",v)})
  .catch((v)=>{console.debug("catch1",v)})

cy1.repeat(10)
cy1.terminate(11)
var cy2 = new rp.Cycle()
cy2.thenAgain((v)=>{console.debug("thenAgain2",v)})
  .then((v)=>{console.debug("then2",v)})
  .catch((v)=>{console.debug("catch2",v)})

cy2.repeat(20)
cy2.fail(21)
```
#### Output
```
thenAgain1 10
thenAgain2 20
then1 11
catch2 21   //due to the asynchronous nature of the objects the order of output can vary
```

# 5. Queue

**Queue** is a very simple object that can be used to queue the execution of functions or promises. It is just a wrapper for an extensible chains of  ```promise.then(f) ```

Its constructor takes no parameter and it has only one method ```enQueue(f)``` 

```enQueue(f)``` adds **f** to the FIFO execution queue . If **f** returns a **Promise** or **f**  is a **Promise** , the queue will wait for the promise to be resolved or rejected. 

 ```enQueue(f)``` returns a **Promise** that is resolved or rejected when **f**  completes.    If **f**  is a function, the **Promise**  resolves to the value returned by  **f**  or is rejected with the error code thrown by  **f** .  

 If  **f**  is a **Promise**,  the **Promise**  returned by  ```enQueue(f)```  is resolved or  rejected when  **f**  is resolved or rejected  and with the same value.  

The execution of the Queue continues normally even if one steps fails. 

### Example (basic) 11

```
var rp = require("repeatable-promise")
var qe = new rp.Queue()
qe.enQueue(()=>{console.debug("Do")})
qe.enQueue((s)=>{console.debug("Re")})
qe.enQueue(()=>{console.debug("Mi")})

```
#### Output
```
Do
Re
Mi
```


### Example  (complex) 12

The following example shows how ```enQueue()``` accepts a function that returns a promise and also returns a promise. 


```
var qe = new rp.Queue()

a = qe.enQueue(new rp.Delay(1000,1))
b = qe.enQueue(()=>{return  new rp.TimeOut(1000,2)})
c = qe.enQueue(()=>{return  3})

a.then((x) => {console.log("success a",x)}).catch((x) => {console.log("failure a",x)})
b.then((x) => {console.log("success b",x)}).catch((x) => {console.log("failure b",x)})
c.then((x) => {console.log("success c",x)}).catch((x) => {console.log("failure c",x)})

```

`new rp.Delay(1000,1)`is a **Promise** that resolves to value **1** after one second. 
```()=>{return  new rp.TimeOut(1000,2)}```  is a function that returns a  **Promise** that rejects with value **2** 
after one second. 
`()=>{return  3}`is a plain function that  that return value **3** when executed
#### Output
```
[... one second wait ...]
success a 1   
[... one second wait ...]
failure b 2
success c 3
```

# 6. Reference

## Defer

A **Defer** is a deferred **Promise** that exposes its **resolve** and **reject** methods outside of its body.
### Methods specific to a Defer 
| Method| Return|  |
| ------------- |-----|----
```new Defer()```|Promise|Creates a deferred promise
```resolve(v)``` |Promise|Passes the value **v** and resolves the deferred promise
```terminate(v)```|Promise| Synonymous to ```resolve(v)``` 
```reject(v)```|Promise| Passes the value V and fails the deferred promise
```fail(v)```|Promise| Synonymous to ```reject(v)``` 


### Methods inherited from Promise (reminder) 
| Method| Return|  |
| ------------- |-----|----
```then(f)``` |Promise|Executes function **f** after the deferred promise is resolved
```catch(f)``` |Promise|Executes function **f** after the deferred promise is rejected
```finally(f)```|Promise| Executes function **f** after the resoltition or rejection

## Delay


A **Delay** is a **Promise** that resolves automatically after a set time.
### Methods
| Method| Return|  |
| ------------- |-----|----
```new Delay(d,v)```|Promise|Creates a promise that resolves after**d** milliseconds and pass the value **v**.

**Delay** derives from a **Defer** and thus also from a **Promise**. All  **Defer** and **Promise** methods are inherited.

## Cycle
**Cycle** is an object based on **Promise** designed for communication/event handling accross a program.   It behaves similarly to a **Promise** but can be retriggered multiple times and remotely.

### Methods specific to a Cycle
| Method| Return|  |
| ------------- |-----|----
```new Cycle()```|Cycle|Creates a repeatable promise
```thenAgain(f)```|Defer|Executes function **f** every time the Cycle is retriggered
```thenOnce(f)```|Defer|Executes function **f** one time, the next time the Cycle is retriggered
```repeat(v)``` |Promise|Passes the value **v** to all listening ```thenAgain(f)``` 
```terminate(v)```|Promise| Terminates the Cycle and all listeners (```thenAgain(f)``` ) with the value **v**
```fail(v)```|Promise| Fails the Cycle and all listeners (```thenAgain(f)``` ) with the value **v**
**repeat** , **terminate** and **fail** are queued and executed asynchronously but in the order of the calls. The returned promise resolved after the method as been excuted in the queue.

**thenAgain** returns a **Defer**. This **Defer** can be resolved or failed to stop the listening process, and the then/catch/finally construct can be used to trigger code upon termination. Terminating the **Cycle** also triggers the termination of all attached **thenAgain** listener. 

### Methods inherited from Defer

| Method| Return|  |
| ------------- |-----|----
```resolve(v)```|Promise| Terminates the Cycle and all listeners (```thenAgain(f)``` ) with the value **v**
```reject(v)```|Promise| Fails the Cycle and all listeners (```thenAgain(f)``` ) with the value 

**resolve**, and **reject** are not queued so some pending ```repeat(v)```  values might be lost.
( **terminate** and **fail** are similar to **resolve** and **reject** but are queued)

### Methods inherited from Promise

A Cycle is promise that is resolved or failed upon termination. Then/catch/finally construct can be used to trigger code after the Cycle is terminated.
| Method| Return|  
| ------------- |-----
```then(f)```|Promise
```catch(f)```|Promise
```finally(f)```|Promise


# 7. Acknowledgement

The code of the Defer object is based on the Defer() function proposed by **Carter** in this post:

https://stackoverflow.com/questions/26150232/resolve-javascript-promise-outside-function-scope

