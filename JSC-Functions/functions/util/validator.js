const isEmpty = (string) => {
    if(string.trim() === '') return true;
        else return false;
};
const isEmail = (email) => {
    const RegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if(email.match(RegEx)) return true;
        else return false;
};

exports.validateSignupData = (data) => {
    let errors = {};
    if(isEmpty(data.email)) {
        errors.email = 'Email is required'
    } else if (!isEmail(data.email)) {
        errors.email = 'Not vaild Email!'
    }
    if(isEmpty(data.password)) errors.password = 'Password is required'
    if(data.confirmPassword !== data.password) errors.confirmPassword = 'Passwords must match!'
    if(isEmpty(data.handle)) errors.handle = 'Handle is required'

    // If the errors object is NOT empty (NOT All the data are vaild and we have ERRORS!) ...
    // return the {errors} object and end the function ...
    // if(Object.keys(errors).length > 0) {
    //     return response.status(400).json(errors);
    // }

    return {
        errors,
        valid: Object.keys(errors).length == 0 ? true : false 
    }
}

exports.validateLoginData = (data) => {
    let errors = {};
    if(isEmpty(data.email)) {
        errors.email = 'Email is required'
    } else if (!isEmail(data.email)) {
        errors.email = 'Not vaild Email!'
    }
    if(isEmpty(data.password)) errors.password = 'Password is required';

    // If the errors object is NOT empty (NOT All the data are vaild and we have ERRORS!) ...
    // return the {errors} object and end the function ...
    // if(Object.keys(errors).length > 0) {
    //     return response.status(400).json(errors);
    // }
    return {
        errors,
        valid: Object.keys(errors).length == 0 ? true : false 
    }
}