import currency from "currency.js";
import sjcl from "sjcl";

export function calculateMoney(allMembers, trips, currencyType) {
  let newData = [];
  let kitLuy = {};

  let totalMember = 0,
    totalPaid = 0,
    totalRemain = 0,
    totalUnPaid = 0,
    totalSpend = 0;
  newData = allMembers.map((member, id) => {
    let luyForTrip = 0;
    let paid = member.paid;
    let luySol = paid;
    trips.forEach((trip) => {
      let { mem_id, spend } = trip;
      try {
        mem_id = JSON.parse(mem_id);
      }catch(e){
        console.log("mem_id already array")
      }
      let osMnek = 0;
      const joinedMemCount = getMemberID(allMembers, mem_id);
      mem_id.forEach((joined) => {
        if (member.id == Number(joined)) {
          osMnek = currency(spend).divide(joinedMemCount);
          luyForTrip += spend / joinedMemCount;
          luySol = member.paid - luyForTrip;
        }
      });
      kitLuy[trip.trp_name] = formatMoney(osMnek, 1, currencyType);
    });
    let unPaid = 0;
    totalPaid += paid;
    totalRemain += luySol > 0 ? luySol : unPaid;
    totalUnPaid += luySol > 0 ? unPaid : luySol;
    return {
      id: id + 1,
      name: member.mem_name,
      paid: currency(paid, { symbol: currencyType }).format(),
      ...kitLuy,
      remain: formatMoney(luySol > 0 ? luySol : unPaid, 2, currencyType),
      unpaid: formatMoney(luySol > 0 ? unPaid : luySol, 2, currencyType),
    };
  });
  totalMember = newData.length;
  totalSpend =
    "-" +
    currency(totalPaid, { symbol: currencyType })
      .subtract(totalRemain)
      .format();
  totalPaid = formatMoney(totalPaid, 2, currencyType);
  totalRemain = formatMoney(totalRemain, 2, currencyType);
  totalUnPaid = formatMoney(totalUnPaid, 2, currencyType);

  return {
    info: { totalMember, totalPaid, totalRemain, totalSpend, totalUnPaid },
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
  let newColumns = [],
    key;
  try {
    key = Object.keys(rows[0]);
  } catch {
    key = headerValues;
  }
  for (let i in key) {
    let title = key[i];
    for (let j in headerValues) {
      if (
        key[i].toLocaleLowerCase().includes(headerValues[j].toLocaleLowerCase())
      ) {
        title = headerValues[j];
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
