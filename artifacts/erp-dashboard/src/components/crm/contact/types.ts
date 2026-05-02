import { z } from "zod";

export interface Contact {
  id: number;
  name: string | null;
  secondName: string | null;
  lastName: string | null;
  post: string | null;
  companyId: number | null;
  phones: { value: string; type: string }[];
  emails: { value: string; type: string }[];
  birthdate: string | null;
  comments: string | null;
  dateCreate: string;
  dateModify: string;
  companyTitle?: string;
  assignedByName?: string;
}

export interface Company {
  id: number;
  title: string;
}

export const contactFormSchema = z.object({
  name: z.string().min(1, "Ism kerak"),
  secondName: z.string().optional(),
  lastName: z.string().optional(),
  post: z.string().optional(),
  companyId: z.coerce.number().nullable().optional(),
  phones: z.array(z.string()).optional(),
  emails: z.array(z.string()).optional(),
  birthdate: z.string().optional(),
  comments: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
