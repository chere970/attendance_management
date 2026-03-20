import RequestForm from "../(components2)/Requestform";
import RequestHistory from "../(components2)/RequestHistory";

export default function RequestPage() {
  return (
    <div className="container mx-auto space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employee Requests</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit a new request and review your request history in one place.
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <div>
          <RequestForm />
        </div>

        <div>
          <RequestHistory />
        </div>
      </div>
    </div>
  );
}
