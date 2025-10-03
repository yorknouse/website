import formidable, { IncomingForm } from "formidable";
import type { NextApiRequest } from "next";

export function ParseForm(
  req: NextApiRequest,
): Promise<{ fields: formidable.Fields }> {
  const form = new IncomingForm();
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields) => {
      if (err) return reject(err);
      resolve({ fields });
    });
  });
}
