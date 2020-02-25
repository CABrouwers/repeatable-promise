# repeatable-promise

Allows to create **Promise-like** objects that can be retriggered multiple times.

These objects can be used to handle asynchronous events/communication between parts of a program or between nodes

The syntax mimicks that of Promises and is very easy to use. 

Events can be both generated and handled in multiple places in the code.

# Usage

## Create the promise:  promiseLike = cycle()

Returns the promise-like object. There is no parameter or option. 
Do not use the  ``new`` keyword, this is not a contructor.
The promise-like object can be passed around the program to enable both triggering and responding from multiple parts of the code

## Activate the event: promiseLike .repeat(val)

This trigger the event with the value ``val``

## Handle the event: promiseLike .thenAgain(fn)

Everytime the ``promiseLike.repeat(val)`` is executed, the function  ``fn`` receives the value ``val`` and is executed.

## Terminate the promise: promiseLike .terminate()

This terminates the promise-like. Even if ``promiseLike.repeat(val)`` is executed, the ``.thenAgain(fn)``  part won't be activated. 

# Example

In this example a counter value is send to two receivers. One of the receiver disables the event when the counter reaches 10.
  
  ## Code
```
var n = 0
var repeatPromise = new cycle()

//this is the receiving side, everytime **repeatPromise**  is activated, the function (x)=>... is executed

repeatPromise.thenAgain(
	(x) => {
		console.log(x)
		if (x >= 10) {
			repeatPromise.terminate()
			clearInterval(timer)
		}
	})

//this another receiver

repeatPromise.thenAgain((x) => {console.log("b",x*x)})

  
//this is the sending side, {repeatPromise.repeat(n++) sends the value n to the all receiving code.
 
var timer = setInterval(() => {repeatPromise.repeat(n++)}, 1000)
```

  ## Output
```
a 0
b 0
a 1
b 1
a 2
b 4
a 3
b 9
a 4
b 16
a 5
b 25
a 6
b 36
a 7
b 49
a 8
b 64
a 9
b 81
a 10
b 100
```

# Acknowledgement

This code uses the defer() function proposed by **Carter** in this post:

https://stackoverflow.com/questions/26150232/resolve-javascript-promise-outside-function-scope

defer()  generates a Promise that can be resolve from outside its body by calling resolve() on it.  

The defer() function is exposed in the module and is available for use.




