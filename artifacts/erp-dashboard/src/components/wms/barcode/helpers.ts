export function statusRangi(status: string) {
  const ranglar: Record<string, string> = {
    QC_HOLD: "bg-yellow-600",
    AVAILABLE: "bg-green-600",
    RESERVED: "bg-blue-600",
    ISSUED: "bg-purple-600",
    CONSUMED: "bg-gray-600",
    RETURNED: "bg-teal-600",
    REJECTED: "bg-red-600",
    SHIPPED: "bg-indigo-600",
    SCRAPPED: "bg-orange-600",
    PENDING: "bg-yellow-600",
    IN_PROGRESS: "bg-blue-600",
    COMPLETED: "bg-green-600",
    ASSIGNED: "bg-cyan-600",
    CANCELLED: "bg-gray-500",
  };
  return ranglar[status] || "bg-gray-600";
}

export function statusNomi(status: string) {
  const nomlar: Record<string, string> = {
    QC_HOLD: "QC kutilmoqda",
    AVAILABLE: "Mavjud",
    RESERVED: "Band qilingan",
    ISSUED: "Berilgan",
    CONSUMED: "Sarflangan",
    RETURNED: "Qaytarilgan",
    REJECTED: "Rad etilgan",
    SHIPPED: "Jo'natilgan",
    SCRAPPED: "Chiqindi",
    PENDING: "Kutilmoqda",
    IN_PROGRESS: "Jarayonda",
    COMPLETED: "Bajarildi",
    ASSIGNED: "Tayinlangan",
    CANCELLED: "Bekor qilingan",
    NOT_RETURNED: "Qaytarilmagan",
    OVER_CONSUMPTION: "Ortiqcha sarflash",
    LOST: "Yo'qolgan",
    DAMAGED: "Shikastlangan",
    EXPLAINED: "Tushuntirilgan",
    DEDUCTED: "Ushlab qolingan",
    RESOLVED: "Hal qilingan",
  };
  return nomlar[status] || status;
}

export function alertRangi(level: string) {
  const ranglar: Record<string, string> = {
    GREEN: "bg-green-600",
    YELLOW: "bg-yellow-500",
    RED: "bg-red-600",
    BLACK: "bg-black text-white",
    NONE: "bg-gray-400",
  };
  return ranglar[level] || "bg-gray-400";
}

export function alertNomi(level: string) {
  const nomlar: Record<string, string> = {
    GREEN: "RUXSAT",
    YELLOW: "OGOHLANTIRISH",
    RED: "BLOKLASH",
    BLACK: "XAVFLI",
    NONE: "Oddiy",
  };
  return nomlar[level] || level;
}

export function harakatTuriNomi(type: string) {
  const nomlar: Record<string, string> = {
    GOODS_RECEIPT: "Qabul",
    PUTAWAY: "Joylashtirish",
    GOODS_ISSUE: "Chiqarish",
    TRANSFER: "Ko'chirish",
    RETURN: "Qaytarish",
    SCRAP: "Chiqindi",
    ADJUSTMENT: "Tuzatish",
    CYCLE_COUNT: "Inventarizatsiya",
    EXIT: "Chiqish",
  };
  return nomlar[type] || type;
}

export function sanaTartiblash(sana: string | null | undefined) {
  if (!sana) return "—";
  return new Date(sana).toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
