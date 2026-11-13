import type { User } from "@/types/crm";
import { base } from "./_helpers";

const s = { isSample: true };
export const usersSeed: User[] = [
  { ...base("u-admin", s), name: "Farhana Kabir", email: "admin@iccb.demo", phone: "01711000001", role: "admin", department: "Management", designation: "CRM Administrator", active: true, roundRobinOrder: 0, color: "#E24F5F" },
  { ...base("u-sm", s), name: "Tanvir Hasan", email: "sales.manager@iccb.demo", phone: "01711000002", role: "sales_manager", department: "Sales", designation: "Head of Sales", active: true, roundRobinOrder: 0, color: "#7A5AF8" },
  { ...base("u-se1", s), name: "Nusrat Jahan", email: "nusrat@iccb.demo", phone: "01711000003", role: "sales_executive", department: "Sales", designation: "Customer Representative", active: true, roundRobinOrder: 1, color: "#2E90FA" },
  { ...base("u-se2", s), name: "Rakib Ahmed", email: "rakib@iccb.demo", phone: "01711000004", role: "sales_executive", department: "Sales", designation: "Customer Representative", active: true, roundRobinOrder: 2, color: "#0BA5EC" },
  { ...base("u-se3", s), name: "Sadia Islam", email: "sadia@iccb.demo", phone: "01711000005", role: "sales_executive", department: "Sales", designation: "Customer Representative", active: true, roundRobinOrder: 3, color: "#15B79E" },
  { ...base("u-mkt", s), name: "Imran Chowdhury", email: "marketing@iccb.demo", phone: "01711000006", role: "marketing", department: "Marketing", designation: "Marketing Manager", active: true, roundRobinOrder: 0, color: "#EE46BC" },
  { ...base("u-ops", s), name: "Mahmudul Karim", email: "operations@iccb.demo", phone: "01711000007", role: "operations", department: "Operations", designation: "Operations Manager", active: true, roundRobinOrder: 0, color: "#F79009" },
  { ...base("u-acc", s), name: "Shirin Akter", email: "accounts@iccb.demo", phone: "01711000008", role: "accounts", department: "Accounts", designation: "Accounts Officer", active: true, roundRobinOrder: 0, color: "#12B76A" },
];

export const SALES_EXECUTIVES = usersSeed.filter((u) => u.role === "sales_executive").map((u) => u.id);
