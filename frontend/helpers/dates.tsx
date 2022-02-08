export const getDateForFileName = () => {
  const date = new Date()
  const dayOfMonth = new Date(date).getDate() < 10 ? `0${new Date(date).getDate()}` : new Date(date).getDate();
  const month = new Date(date).getMonth() + 1;
  const formattedMonth = month < 10 ? `0${month}` : month;
  const hours = new Date(date).getHours() < 10 ? `0${new Date(date).getHours()}` : new Date(date).getHours();
  const minutes = new Date(date).getMinutes() < 10 ? `0${new Date(date).getMinutes()}` : new Date(date).getMinutes();

  return `${date.getFullYear()}${formattedMonth}${dayOfMonth}_${hours}${minutes}`;
};