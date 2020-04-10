# repeatable-promise

This module provides two Promise-like objects that can be used to communicate asynchronously between different parts of a program. The syntax is based on that of Promises and these objects are very simple to use. 

``Defer`` is a Promise that can be resolved remotely, e.g. outside of its body. It can be used for one time events.
``Cycle`` is very similar to a Promise but can be retriggered multiple times, also remotely.

# Defer

## Usage

The syntax is simple and similar to that of a Promise
The constructor has not argument:  ```new Defer()```

The key methods are :

```then(f)``` to define code to be executed asynchronously.

```resolve(v)``` to pass a value and trigger execution of the code.

note:```terminate(v)``` can also be used is a synonym of ```resolve(v)```  

### Example 1

```
df = new Defer() 
df.then((val)=>{console.debug("received",val)}
df.resolve(45)
```
#### Ouput
```
received 45
```

## Details

then() returns a Promise and thus can bet chained with regular Promises
```
df
  .then((val)=>{console.debug("received",val)}
  .then(()=>{console.debug("something else")}
```

The Defer object can also handle the failure case with the following functions

```catch(f)``` to define code to be executed asynchronously upon failure

```reject(v)``` to passe a value and trigger the failure code.

### Example 2
```
df = new Defer()   
df.catch((val)=>{console.debug("failed",val)}
df.reject(99)
```
#### Output
```
failed 99
```

# Cycle


## Usage

The syntax is simple and mimicks that of a Promise

The constructor has no argument:  ```new Cycle()```

The key methods are :

```thenAgain(f)``` to define code to be executed asynchronously.

```repeat(v)``` to trigger to pass a value and execution of the code .


### Example 3

```
cy = new Cycle() 
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

### Example 4
```
cy = new Cycle() 
df = cy.thenAgain((val)=>{console.debug("received",val)}) 		// df is a Defer object.
df.then((val)=>{console.debug("the Defer is resolved with value",val)}) // to be excuted after resolution
cy.repeat(1)
setTimeout(
  ()=>{df.resolve(99) 								// the Defer is resolved
  cy.repeat(2)
  },100)
```
The timer is needed to ensure that ```cy.repeat(1)``` is fully executed before ```df.resolve(99)``` is executed. It is not necessary the case without the timer because ```cy.repeat(1)``` is executed in asynchronously (see example 7 for behaviour without the timer). 

#### Output
```
received 1
the Defer is resolved with value 99
```


### terminate(val)

The Cycle object has also a ```terminate(val)``` method. This method disables the Cycle and all future calls to ```repeat(v)``` will be ignored.  Also, all Defer objects created with the ```thenAgain(func)```  will be resolved with the value passed to terminate.


### Example 5
```
cy = new Cycle() 
df = cy.thenAgain((val)=>{console.debug("received",val)}) 		// df is a Defer object.
df.then((val)=>{console.debug("the Defer is resolved with value",val)}) // to be excuted after resolution
cy.repeat(1)
cy.terminate(99)							// the Cycle is terminated
cy.repeat(2)
```
A timer is not necessary as in example 4 because calls to  ```cy.repeat(val)``` and ```cy.terminate(val)``` are queued and are always executed asynchronoulsy but in the orders they were made.
#### Output
```
received 1
the Defer is resolved with value 99
```


### Example 6 (complex)

```
var timer
cy =  new Cycle()
df1 = cy.thenAgain((val)=>{console.debug("1 received",val)})
df1.then((val)=>{console.debug("1 is terminated with value",val)})
df2 = cy.thenAgain((val)=>{console.debug("2 received",val)})
df2.then((val)=>{console.debug("2 is terminated with value",val)})
df3 = cy.thenAgain((val)=>{if(val>=3) {df1.resolve(100)}})
df4 = cy.thenAgain((val)=>{if(val>=5) {
  cy.terminate(999)
  clearInterval(timer)
  }})

n = 1
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

Calls to methods on a Cycle object can occurs in where in the code where this Cycle object is available.
The only guarantee is that the execution of all ```cy.repeat(val)``` and ```cy.terminate(val)``` calls wil be queued and executed successively in the order they were made. A call to ```df.resolve(val)``` (where ```df = cy.thenAgain(f)```) is not queued and  ```cy.thenAgain(f)``` can be resolved/disabled before all pending values  from ```cy.repeat(val)``` are treated. 

### Example 7
```
cy = new Cycle() 
df = cy.thenAgain((val)=>{console.debug("received",val)}) 		// df is a Defer object.
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

# Acknowledgement

This code uses the Defer() function proposed by **Carter** in this post:

https://stackoverflow.com/questions/26150232/resolve-javascript-promise-outside-function-scope

