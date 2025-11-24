/**
 * Region choices for Discord command options
 * Used across multiple admin commands that require region selection
 */
export const REGION_CHOICES = [
  { name: "NA (North America)", value: "na1" },
  { name: "EUW (Europe West)", value: "euw1" },
  { name: "EUNE (Europe Nordic & East)", value: "eun1" },
  { name: "KR (Korea)", value: "kr" },
  { name: "BR (Brazil)", value: "br1" },
  { name: "LAN (Latin America North)", value: "la1" },
  { name: "LAS (Latin America South)", value: "la2" },
  { name: "OCE (Oceania)", value: "oc1" },
  { name: "RU (Russia)", value: "ru" },
  { name: "TR (Turkey)", value: "tr1" },
  { name: "JP (Japan)", value: "jp1" },
  { name: "PH (Philippines)", value: "ph2" },
  { name: "SG (Singapore)", value: "sg2" },
  { name: "TH (Thailand)", value: "th2" },
  { name: "TW (Taiwan)", value: "tw2" },
  { name: "VN (Vietnam)", value: "vn2" },
] as const;
