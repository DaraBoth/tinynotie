import currency from "currency.js";
import sjcl from "sjcl";

export function calculateMoney(allMembers, trips, currencyType) {
  let newData = [];

  let totalMember = 0,
    totalPaid = 0,
    totalRemain = 0,
    totalUnPaid = 0,
    totalSpend = 0;

  // Track how much each member owes for trips they joined
  const memberShares = {};

  // Initialize tracking objects
  allMembers.forEach(member => {
    memberShares[member.id] = 0;
  });

  // Calculate each member's share of each trip
  trips.forEach(trip => {
    const spend = Number(trip.spend);

    // Calculate each member's share of this trip
    let mem_id = trip.mem_id;
    try {
      mem_id = JSON.parse(mem_id);
    } catch(e) {
      console.log("mem_id already array");
    }

    const joinedMemCount = getMemberID(allMembers, mem_id);
    if (joinedMemCount > 0) {
      const sharePerMember = spend / joinedMemCount;

      mem_id.forEach(joined => {
        const memberId = Number(joined);
        if (memberShares[memberId] !== undefined) {
          memberShares[memberId] += sharePerMember;
        }
      });
    }
  });

  newData = allMembers.map((member, id) => {
    const memberId = member.id;

    // How much this member has paid to the group (from member_infm table)
    const paid = member.paid || 0;

    // How much this member owes for all trips they participated in
    const memberShare = memberShares[memberId] || 0;

    // Calculate the remaining balance
    // This is how much money the member has left after accounting for their share of expenses
    let balance = paid - memberShare;

    // Determine if the member has unpaid amounts or remaining funds
    let remain = balance > 0 ? balance : 0;
    let unPaid = balance < 0 ? Math.abs(balance) : 0;

    // Build trip-specific expense data
    let tripExpenses = {};
    trips.forEach((trip) => {
      let { mem_id, spend } = trip;
      try {
        mem_id = JSON.parse(mem_id);
      } catch(e) {
        // Already an array
      }

      const joinedMemCount = getMemberID(allMembers, mem_id);

      // Check if this member participated in this trip
      const participated = mem_id.some(joined => Number(joined) === memberId);

      if (participated && joinedMemCount > 0) {
        const memberShare = currency(spend).divide(joinedMemCount).value;
        tripExpenses[trip.trp_name] = formatMoney(memberShare, 1, currencyType);
      } else {
        tripExpenses[trip.trp_name] = "-/-";
      }
    });

    // Update totals
    totalPaid += paid;
    totalRemain += remain;
    totalUnPaid += unPaid;

    return {
      id: id + 1,
      name: member.mem_name,
      paid: formatMoney(paid, 2, currencyType), // Total amount paid by this member
      ...tripExpenses,
      remain: formatMoney(remain, 2, currencyType),
      unpaid: formatMoney(unPaid, 2, currencyType),
    };
  });

  totalMember = newData.length;

  // Calculate total spend (negative of the difference between total paid and remaining)
  totalSpend =
    "-" +
    currency(totalPaid, { symbol: currencyType })
      .subtract(totalRemain)
      .format();

  // Format totals for display
  const formattedTotalPaid = formatMoney(totalPaid, 2, currencyType);
  const formattedTotalRemain = formatMoney(totalRemain, 2, currencyType);
  const formattedTotalUnPaid = formatMoney(totalUnPaid, 2, currencyType);

  return {
    info: {
      totalMember,
      totalPaid: formattedTotalPaid,
      totalRemain: formattedTotalRemain,
      totalSpend,
      totalUnPaid: formattedTotalUnPaid
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
  let headerValues = ["ID", "Name", "Paid", "Remain", "Unpaid"];
  let headerMapping = {
    "id": "ID",
    "name": "Name",
    "paid": "Paid",
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

    if (title === "Paid") {
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
