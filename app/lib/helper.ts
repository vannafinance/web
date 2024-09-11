export const sleep = (duration: number) => {
  // duration = 1000 => 1 second
  return new Promise<void>(function (resolve, _reject) {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};

export const ceilWithPrecision = (n: string, precision = 3) => {
  let num = parseFloat(n);
  // Check if the conversion was successful
  if (isNaN(num)) {
    return n;
  }
  // Round to two decimal places
  return num.toFixed(precision);
};

export const ceilWithPrecision6 = (n: string, precision = 6) => {
  let num = parseFloat(n);
  // Check if the conversion was successful
  if (isNaN(num)) {
    return n;
  }
  // Round to two decimal places
  return num.toFixed(precision);
};
