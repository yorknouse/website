/**
 * A global date formatter to use to keep dates consistent
 */
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export default dateFormatter;
