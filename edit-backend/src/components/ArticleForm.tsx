'use client';

// import { contactSchema } from '@/lib/validation/contact';
import React, { SubmitEvent, useState } from 'react';
import DualEditor from "@/components/Editor";

type FormValues = {
  // name: string;
  // email: string;
  draft: string;
};

export default function ArticleForm({article}: {article: any}) {
  const [values, setValues] = useState<FormValues>({
    // name: '',
    // email: '',
    draft: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditorChange = (value: string) => {
    setValues((prev) => ({...prev, ['draft']: value}));
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const {name, value} = e.target;
    setValues((prev) => ({...prev, [name]: value}));
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();          // stop normal browser submit
    setErrorHeader(null);
    setError(null);
    setIsSubmitting(true);

    console.log("submit")

    // const result = contactSchema.safeParse(values);
    // if (!result.success) {
    //   const errorJson = JSON.parse(result.error.message);
    //   let messages: string[] = [];
    //   for (const errorJsonKey of errorJson) {
    //     console.log(errorJsonKey.message);
    //     messages.push(errorJsonKey.message);
    //   }
    //   setErrorHeader("Validation failed");
    //   setError(messages.join(', '));
    //   setIsSubmitting(false);
    //
    //   return;
    // }
    // const {name, email, message} = result.data;

    try {
      const res = await fetch('/api/backend/article', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          // name: name,
          // email: email,
          draft: values.draft,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorHeader("Send message failed")
        setError(data.message || 'Something went wrong');
        return;
      }

      // Success
      setSuccess("Successfully sent message")
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full mx-auto">
      {error &&
          <div className={"bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-2 mb-2"} role={"alert"}>
              <strong className={"font-bold"}>{errorHeader}</strong>
              <p>{error}</p>
          </div>
      }
      {success &&
          <div className={"bg-green-100 border-l-4 border-green-500 text-green-700 p-2 mb-2"} role={"alert"}>
              <strong className={"font-bold"}>Success</strong>
              <p>{success}</p>
          </div>
      }
      {/*<div className="flex flex-wrap -mx-3 mb-6">*/}
      {/*  <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">*/}
      {/*    <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"*/}
      {/*           htmlFor="grid-name">*/}
      {/*      Name*/}
      {/*    </label>*/}
      {/*    <input*/}
      {/*      className={"appearance-none block w-full bg-gray-100 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"}*/}
      {/*      id={"grid-name"} type={"text"} placeholder={"Jane Doe"} name={"name"}*/}
      {/*      value={values.name}*/}
      {/*      onChange={handleChange}/>*/}
      {/*  </div>*/}
      {/*  <div className="w-full md:w-1/2 px-3">*/}
      {/*    <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"*/}
      {/*           htmlFor="grid-email">*/}
      {/*      Email*/}
      {/*    </label>*/}
      {/*    <input*/}
      {/*      className={"appearance-none block w-full bg-gray-100 text-gray-700 border rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"}*/}
      {/*      id="grid-email" type="text" placeholder="jane.doe@example.com" name={"email"}*/}
      {/*      value={values.email}*/}
      {/*      onChange={handleChange}/>*/}
      {/*  </div>*/}
      {/*</div>*/}
      <div className="flex flex-wrap -mx-3 mb-6">
        <div className="w-full px-3">
          <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                 htmlFor="grid-message">
            Message
          </label>
          <DualEditor
            initialMarkdown={
              article.articlesDrafts[0].articlesDrafts_markdown !== null
                ? article.articlesDrafts[0].articlesDrafts_markdown
                : undefined
            }
            onChange={handleEditorChange}
          />
      </div>
      </div>
      <span className={"px-2 py-2"}>
        <button type={"submit"} disabled={isSubmitting}
                className={
                  "inline-block rounded-sm px-2 py-2 shadow-sm bg-blue-600 hover:bg-blue-700 transition text-white"
                }
                title={isSubmitting ? 'Sending…' : 'Send Message'}
        >
          {isSubmitting ? 'Sending…' : 'Send Message'}
        </button>
      </span>
    </form>
  );
}