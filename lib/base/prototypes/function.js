/*****************************************
 *
 * Function Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, false, className || 'Function');
}
util.inherits(FunctionProtoToStringFunc, FunctionTypeBase);
FunctionProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (thisVal.className !== 'Function') {
		throwNativeException('TypeError', 'Cannot invoke non-function type');
	}
	return ObjectProtoToStringFunc.apply(this, arguments);
};

/**
 * apply() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoApplyFunc(className) {
	FunctionTypeBase.call(this, 2, false, className || 'Function');
}
util.inherits(FunctionProtoApplyFunc, FunctionTypeBase);
FunctionProtoApplyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var thisArg = args[0],
		argArray = args[1],
		len,
		argList = [],
		i = 0;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(thisVal)) {
		throwNativeException('TypeError', 'Attempted to call non-callable value');
	}
	
	if (!argArray || isType(argArray, ['Undefined', 'Null'])) {
		return thisVal.call(thisArg, []);
	}
	
	if (!isObject(argArray)) {
		throwNativeException('TypeError', 'Arguments value is not an object');
	}
	
	len = toUint32(argArray.get('length')).value;
	for (; i < len; i++) {
		argList.push(argArray.get(i));
	}
	
	return thisVal.call(thisArg, argList);
};

/**
 * call() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoCallFunc(className) {
	FunctionTypeBase.call(this, 1, false, className || 'Function');
}
util.inherits(FunctionProtoCallFunc, FunctionTypeBase);
FunctionProtoCallFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var thisArg = args[0],
		argList = [],
		i = 1,
		len = args.length;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(thisVal)) {
		throwNativeException('TypeError', 'Attempted to call non-callable value');
	}
	
	for (; i < len; i++) {
		argList.push(args[i]);
	}
	
	return thisVal.call(thisArg, argList);
};

/**
 * bind() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoBindFunc(className) {
	FunctionTypeBase.call(this, 1, false, className || 'Function');
}
util.inherits(FunctionProtoBindFunc, FunctionTypeBase);
FunctionProtoBindFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var target = thisVal,
		thisArg = args[0],
		a = args.slice(1),
		f;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(target)) {
		throwNativeException('TypeError', 'Attempted to call non-callable value');
	}
	
	// Create the new function
	f = new FunctionType();
	f.targetFunction = target;
	f.boundThis = thisArg;
	f.boundArgs = a;
	f.extensible = true;
	
	// Set the call method
	f.call = function call(thisVal, extraArgs) {
		return target.call(thisArg, a.concat(extraArgs));
	};
	
	// Set the construct method
	f.construct = function construct(extraArgs) {
		if (!target.construct) {
			throwNativeException('TypeError', 'Bind target does not have a constructor');
		}
		return target.construct(a.concat(extraArgs));
	};
	
	// Set the hasInstance method
	f.hasInstance = function hasInstance(v) {
		if (!target.hasInstance) {
			throwNativeException('TypeError', 'Bind target does not have a hasInstance method');
		}
		return target.hasInstance(v);
	};
	
	// Set the length property
	f.put('length', new NumberType(target.className === 'Function' ? 
		Math.max(0, target.get('length').value - a.length) : 0), false, true);
	
	// Set caller and arguments to thrower
	f.defineOwnProperty('caller', {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false, true);
	f.defineOwnProperty('arguments', {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false, true);
	
	return f;
};

/**
 * @classdesc The prototype for Functions
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.3.4
 */
exports.FunctionPrototypeType = FunctionPrototypeType;
function FunctionPrototypeType(className) {
	
	// Warning: setting the third argument to anything falsey, or leaving it off, results in infinite recursion
	FunctionTypeBase.call(this, 0, true, className || 'Function');
	
	// Object prototype methods
	this.put('toLocaleString', new ObjectProtoToLocaleStringFunc(), false, true);
	this.put('valueOf', new ObjectProtoValueOfFunc(), false, true);
	this.put('hasOwnProperty', new ObjectProtoHasOwnPropertyFunc(), false, true);
	this.put('isPrototypeOf', new ObjectProtoIsPrototypeOfFunc(), false, true);
	this.put('propertyIsEnumerable', new ObjectProtoPropertyIsEnumerableFunc(), false, true);
	
	// Function prototype methods
	this.put('toString', new FunctionProtoToStringFunc(), false, true);
	this.put('apply', new FunctionProtoApplyFunc(), false, true);
	this.put('call', new FunctionProtoCallFunc(), false, true);
	this.put('bind', new FunctionProtoBindFunc(), false, true);
}
util.inherits(FunctionPrototypeType, FunctionTypeBase);