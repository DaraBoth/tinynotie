import moment from 'moment';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

export function formatTimeDifference(dateString) {
  const originalDate = moment(dateString);
  const currentDate = moment();

  const daysAgo = differenceInDays(currentDate.toDate(), originalDate.toDate());
  const hoursAgo = differenceInHours(currentDate.toDate(), originalDate.toDate());
  const minutesAgo = differenceInMinutes(currentDate.toDate(), originalDate.toDate());
  const secondsAgo = differenceInSeconds(currentDate.toDate(), originalDate.toDate());
  if (daysAgo > 0) {
    return `${daysAgo} days ago`;
  } else if (hoursAgo > 0) {
    return `${hoursAgo} hours ago`;
  } else if (minutesAgo > 0) {
    return `${minutesAgo} minutes ago`;
  } else if (secondsAgo > 0) {
    return `${secondsAgo} seconds ago`;
  } else if (dateString == null) {
    return "no update"
  } else {
    return 'Just now';
  }
}