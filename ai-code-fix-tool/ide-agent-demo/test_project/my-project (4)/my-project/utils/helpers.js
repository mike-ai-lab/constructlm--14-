{
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export { formatNumber };

FILE: my-project/services/api.js