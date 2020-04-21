
# repeatable-promise

This module provides four Promise objects that extend the promises. The most important one **Cycle** is  design to communicate asynchronously between different parts of a program. These objects are very simple to use once one is a little familiar with Promises.. 

``Defer`` is a Promise that can be resolved remotely, e.g. outside of its body. It can be used for one time events.
``Cycle`` is  a Promise that can be retriggered multiple times, also remotely.
``Delay`` is a **Defer** that resolves itself after a set time.
``Queue`` is an object that queues/chains function calls or promise resolution 

Technically, the **Defer** object is a **Promise** that exposes its ```Resolve(v)``` and ```Reject(v)``` methods outside of its body.  The Cycle object wraps a series of **Defer** objects that are renewed with each retriggering. **Delay** is just a **Defer** with a timer.  And **Queue** is just  a wrapper around an extensible chain of Promise.then calls.

Several methods of these two objects expose the underlying Promise object allowing the use of the Promise then-catch construct on them or to chain them with other promise objects.

# Defer

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
df.then((val)=>{console.debug("received",val)}
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

The error case can be triggered  with ```reject(v)``` applied to the Defer object

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

# Delay

**Delay** is just a Promise that resolves itself after a delay. It is based on **Defer** and exposes the same methods as **Defer**.   The construtor us different as it accepts two parameter: the delay in milliseconds and an optional passed at resolution.


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
# Cycle


## Usage

The syntax is simple and mimicks that of a Promise

The constructor has no argument:  ```new Cycle()```

The key methods are :

```thenAgain(f)``` to define code to be executed asynchronously.

```repeat(v)``` to trigger to pass a value and execution of the code .


### Example 4

```
var rp = require("repeatable-promise")
var cy = new rp.Cycle() 
cy.thenAgain((val)=>{console.debug("received",val)}
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
### resolve()

The ```thenAgain(func)``` method returns a Defer/Promise object. This object can be resolved by calling the ```resolve(val)``` method. This resolution of the Defer/Promise stops all further triggering by the repeat function. 
Other instances of the ```thenAgain(func)```  will continue to be triggered. 

Note: 
The ```terminate(val)``` method can also be used on the Defer object, it is equivalent (synonymous) to ```resolve(val)```

### Example 5
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


### Example 6
```
var rp = require("repeatable-promise")
var cy = new rp.Cycle() 
var df = cy.thenAgain((val)=>{console.debug("received",val)}) 		// df is a Defer object.
df.then((val)=>{console.debug("the Defer is resolved with value",val)}) // to be excuted after resolution
cy.repeat(1)
cy.terminate(99)							// the Cycle is terminated
cy.repeat(2)
```
A timer is not necessary as in example 5 because calls to  ```cy.repeat(val)``` and ```cy.terminate(val)``` are queued and are always executed asynchronoulsy but in the orders they were made.  Both methods return a Promise that is resolved fater the calls are executed in the queue. 

#### Output
```
received 1
the Defer is resolved with value 99
```


### Example 7 (complex)

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
let timer = setInterval(()=>{cy.repeat(n)
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

### Example 8
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

### Example 9
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

# Queue

**Queue** is a very simple object that can be used to queue the execution of functions. It just a wrapper for an extensible chains of  ```promise.then(f) ```

Its constructor takes one optional parameter and it has only one method ```enQueue(f)```

**f** is the following function execution to be added to the queue. If **f** returns a Promise, the queue will wait for the promise to be resolved.  ```enQueue(f)``` returns a promise that is resolved when **f**  is completed (even if more functions have been added to the queue later.

Since the function calls are chained through the ```promise.then(f) ``` mechanism, the result of one execution is passed to the next call as a parameter.  The optional parameter of the constructor is the first value in the chain.

### Example (basic) 10

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


### Example  (complex) 11

The following example shows how ```enQueue()``` accepts a function that returns a promise and also returns a promise. It also demonstrates the passing of a value in the chain. 
```
var rp = require("repeatable-promise")
var qe = new rp.Queue(1)

qe.enQueue((v)=>{console.debug("Do",v) ;return v+1})
qe.enQueue((v)=>{return  new  rp.Delay(1000,v+1)}).then(()=>{console.debug("zing",v)})
qe.enQueue((v)=>{console.debug("Re",v) ;return v+1})
qe.enQueue((v)=>{return  rp.Delay(1000,v+1)})
qe.enQueue((v)=>{console.debug("Mi",v) ;return v+1})

```

`()=>{return new rp.Delay(1000)}` returns a promise
```qe.enQueue(()=>{return new rp.Delay(1000)})``` also returns a promise
#### Output
```
Do 1
zing 3
Re 3
Mi 5
```

# Acknowledgement

This code of the Defer object is based on the Defer() function proposed by **Carter** in this post:

https://stackoverflow.com/questions/26150232/resolve-javascript-promise-outside-function-scope

