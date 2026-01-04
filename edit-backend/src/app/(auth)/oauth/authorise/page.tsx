import Image from "next/image";

export default async function Authorize({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    redirectUri?: string;
    state?: string;
    client?: string;
  }>;
}) {
  const awaitedSearchParams = await searchParams;
  const code = awaitedSearchParams.code;
  const redirectUri = awaitedSearchParams.redirectUri;
  const state = awaitedSearchParams.state;
  const client = awaitedSearchParams.client;

  if (!code || !redirectUri || !state || !client) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://bbcdn.nouse.co.uk/file/nouseSiteAssets/headerImages/centralhall-comp.jpg')",
        }}
      >
        <div className="bg-white/95 shadow-xl rounded-2xl p-8 w-full max-w-md text-center text-black">
          <div className="flex justify-center mb-6 mt-2">
            <Image
              src={
                "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-full3.svg"
              }
              alt={"Nouse logo"}
              width={240}
              height={80}
              className={"object-contain"}
            />
          </div>

          <h3 className={"text-2xl font-semibold mb-4 text-center"}>
            Error missing parameters
          </h3>

          <p>Click below to return to Nouse backend</p>

          <br />

          <a
            href={"/"}
            className="flex items-center justify-center gap-3 w-full py-2.5 border border-gray-300 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-all duration-200"
          >
            Return to Nouse backend
          </a>
        </div>
      </div>
    );
  }

  const link =
    `${redirectUri}/?code=${code}` + (state ? `&state=${state}` : "");

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://bbcdn.nouse.co.uk/file/nouseSiteAssets/headerImages/centralhall-comp.jpg')",
      }}
    >
      <div className="bg-white/95 shadow-xl rounded-2xl p-8 w-full max-w-md text-center text-black">
        <div className="flex justify-center mb-6 mt-2">
          <Image
            src={
              "https://bbcdn.nouse.co.uk/file/nouseSiteAssets/logo/nouse-logo-full3.svg"
            }
            alt={"Nouse logo"}
            width={240}
            height={80}
            className={"object-contain"}
          />
        </div>

        <h3 className={"text-2xl font-semibold mb-4 text-center"}>
          Did you click to login to {client}?
        </h3>

        <div className={"text-left"}>
          <p>
            When you click continue, Nouse will pass the following details to
            the service that brought you to this page to allow you to login.
            Please make sure you trust the link you clicked on.
          </p>
          <br />
          <ul className={"list-disc pl-4"}>
            <li>Name</li>
            <li>York.ac.uk Email Address</li>
            <li>Nouse.co.uk Email Address</li>
            <li style={{ fontStyle: "italic" }}>
              Whether you have permission to access this service
            </li>
          </ul>
          <br />
        </div>

        <a
          href={link}
          className="flex items-center justify-center gap-3 w-full py-2.5 border border-gray-300 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-all duration-200"
        >
          Continue to {client}
        </a>
      </div>
    </div>
  );
}
