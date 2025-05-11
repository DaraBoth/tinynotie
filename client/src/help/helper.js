import currency from "currency.js";
import sjcl from "sjcl";

export function calculateMoney(allMembers, trips, currencyType) {
  let newData = [];
  let kitLuy = {};

  let totalMember = 0,
    totalPaid = 0,
    totalPayFirst = 0,
    totalDirectPaid = 0,
    totalRemain = 0,
    totalUnPaid = 0,
    totalSpend = 0;

  // First, calculate how much each member has paid for trips (Pay First)
  const memberPayments = {};
  allMembers.forEach(member => {
    memberPayments[member.id] = 0;
  });

  // Add payments made by members as payers (Pay First)
  trips.forEach(trip => {
    const payerId = trip.payer_id ? Number(trip.payer_id) : null;
    if (payerId) {
      memberPayments[payerId] = (memberPayments[payerId] || 0) + Number(trip.spend);
    }
  });

  newData = allMembers.map((member, id) => {
    let luyForTrip = 0; // How much this member owes for all trips they participated in
    let payFirst = memberPayments[member.id] || 0; // How much this member paid as a payer (Pay First)
    let directPaid = member.paid || 0; // How much this member has directly paid to the group (from member_infm table)
    let totalPaidAmount = directPaid + payFirst; // Total amount paid (direct payments + trip payments)
    let luySol = totalPaidAmount; // Initial balance

    trips.forEach((trip) => {
      let { mem_id, spend, payer_id } = trip;
      try {
        mem_id = JSON.parse(mem_id);
      } catch(e) {
        console.log("mem_id already array");
      }

      let osMnek = 0;
      const joinedMemCount = getMemberID(allMembers, mem_id);

      // Calculate this member's share of the trip expense
      mem_id.forEach((joined) => {
        if (member.id == Number(joined)) {
          // This member participated in the trip
          const memberShare = currency(spend).divide(joinedMemCount).value;
          osMnek = memberShare;
          luyForTrip += memberShare;

          // Adjust balance based on whether this member was the payer
          if (member.id == Number(payer_id)) {
            // If this member paid for the trip, they only owe their share
            // The payment itself is already accounted for in payFirst
          } else {
            // If someone else paid, this member owes their share
            luySol = totalPaidAmount - luyForTrip;
          }
        }
      });

      // Store the amount this member owes for this specific trip
      kitLuy[trip.trp_name] = formatMoney(osMnek, 1, currencyType);
    });

    let unPaid = 0;
    if (luySol < 0) {
      // If balance is negative, this member owes money
      unPaid = Math.abs(luySol);
      luySol = 0;
    }

    totalPaid += totalPaidAmount;
    totalPayFirst += payFirst;
    totalDirectPaid += directPaid;
    totalRemain += luySol;
    totalUnPaid += unPaid;

    return {
      id: id + 1,
      name: member.mem_name,
      payFirst: formatMoney(payFirst, 2, currencyType), // New column: money paid upfront for trips
      directPaid: formatMoney(directPaid, 2, currencyType), // Renamed from 'paid': direct contributions
      totalPaid: formatMoney(totalPaidAmount, 2, currencyType), // Total of payFirst + directPaid
      ...kitLuy,
      remain: formatMoney(luySol, 2, currencyType),
      unpaid: formatMoney(unPaid, 2, currencyType),
    };
  });

  totalMember = newData.length;
  totalSpend =
    "-" +
    currency(totalPaid, { symbol: currencyType })
      .subtract(totalRemain)
      .format();

  // Format totals for display
  totalPaid = formatMoney(totalPaid, 2, currencyType);
  totalPayFirst = formatMoney(totalPayFirst, 2, currencyType);
  totalDirectPaid = formatMoney(totalDirectPaid, 2, currencyType);
  totalRemain = formatMoney(totalRemain, 2, currencyType);
  totalUnPaid = formatMoney(totalUnPaid, 2, currencyType);

  return {
    info: {
      totalMember,
      totalPaid,
      totalPayFirst,
      totalDirectPaid,
      totalRemain,
      totalSpend,
      totalUnPaid
    },
    newData,
  };
}

export function formatMoney(money, option = 2, currencyType) {
  const USD = (value) => currency(value, { symbol: currencyType }).format();
  if (!money) return "-/-  ";
  if (option === 1) {
    return "-" + USD(money);
  }
  if (option === 2) {
    return USD(money);
  }
  if (option === 3) {
    return USD(money);
  } else {
    return USD(money);
  }
}

export function getMemberID(allMember, selectedMember) {
  let newArrayId = [];
  for (let i in allMember) {
    for (let j in selectedMember) {
      if (allMember[i].id === selectedMember[j]) {
        newArrayId[j] = allMember[i].id;
      }
    }
  }
  return newArrayId.length;
}

export function functionRenderColumns(rows) {
  let headerValues = ["ID", "Name", "Pay First", "Direct Paid", "Total Paid", "Remain", "Unpaid"];
  let headerMapping = {
    "id": "ID",
    "name": "Name",
    "payFirst": "Pay First",
    "directPaid": "Direct Paid",
    "totalPaid": "Total Paid",
    "remain": "Remain",
    "unpaid": "Unpaid"
  };

  let newColumns = [],
    key;
  try {
    key = Object.keys(rows[0]);
  } catch {
    key = headerValues;
  }

  for (let i in key) {
    let title = key[i];

    // Check if we have a direct mapping for this key
    if (headerMapping[key[i]]) {
      title = headerMapping[key[i]];
    } else {
      // Fall back to the old method for trip-specific columns
      for (let j in headerValues) {
        if (
          key[i].toLocaleLowerCase().includes(headerValues[j].toLocaleLowerCase())
        ) {
          title = headerValues[j];
        }
      }
    }

    newColumns[i] = {
      field: key[i],
      headerName: title,
      headerAlign: "center",
      align: "center",
      minWidth: 110 + key[i].length,
    };

    if (title === "Name") {
      newColumns[i] = {
        ...newColumns[i],
        minWidth: 110,
        headerAlign: "left",
        align: "left",
        hideable: false,
      };
    }

    if (title === "Remain" || title === "Unpaid") {
      newColumns[i] = {
        ...newColumns[i],
        minWidth: 110,
        headerAlign: "right",
        align: "right",
      };
    }

    if (title === "Pay First" || title === "Direct Paid" || title === "Total Paid") {
      newColumns[i] = {
        ...newColumns[i],
        minWidth: 110,
        headerAlign: "right",
        align: "right",
      };
    }

    if (title === "ID") {
      newColumns[i] = {
        ...newColumns[i],
        hidden: false,
        minWidth: 60,
        width: 60,
      };
    }
  }

  return newColumns;
}

export function numberAddition(s) {
  return Math.floor(currency((s + "").replace("W", "").replace("-", "")).value);
}

/**
 * Encodes an object to a Base64 string, supporting Unicode characters.
 * @param {object} data - The object to encode.
 * @returns {string} - The Base64 encoded string.
 */
export const encodeObjectToBase64 = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const utf8Bytes = new TextEncoder().encode(jsonString);
    const base64Encoded = btoa(String.fromCharCode(...utf8Bytes));
    return base64Encoded;
  } catch (error) {
    return null; // Return null in case of an error
  }
};

/**
 * Decodes a Base64 string back to an object, supporting Unicode characters.
 * @param {string} base64Data - The Base64 string to decode.
 * @returns {object | null} - The decoded object. Returns null if decoding fails.
 */
export const decodeBase64ToObject = (base64Data) => {
  try {
    const utf8Bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    const jsonString = new TextDecoder().decode(utf8Bytes);
    return JSON.parse(jsonString);
  } catch (error) {
    return { isError: true };
  }
};
