/* Page: Customer-support - contact-us */
import { useForm, useWatch } from "react-hook-form";
import { Clock, Mail, Phone } from "lucide-react";

import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import PageShell from "../../components/layout/PageShell";
import { useToast } from "../../context/ToastContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useContentVersion } from "../../context/ContentContext";
import { sendMessage } from "../../services/content/contactApi";
import { getSettings } from "../../services/content/settingsApi";
import { CONTACT_EMAIL } from "../../utils/constants";

const SUBJECTS = [
  { value: "order", label: "An existing order", to: "support" },
  { value: "returns", label: "Returns or exchanges", to: "support" },
  { value: "sizing", label: "Sizing or styling advice", to: "support" },
  { value: "press", label: "Press or partnerships", to: "general" },
  { value: "privacy", label: "Privacy or data request", to: "general" },
  { value: "other", label: "Something else", to: "general" },
];

export default function ContactUsPage() {
  const { toast } = useToast();

  const version = useContentVersion();
  const { data: settings } = useAsyncData(getSettings, [version]);

  const contact = settings?.contact;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm({
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const subject = useWatch({ control, name: "subject" });
  const chosen = SUBJECTS.find((s) => s.value === subject);

  const routedTo =
    chosen?.to === "general"
      ? (contact?.general ?? CONTACT_EMAIL.general)
      : (contact?.support ?? CONTACT_EMAIL.support);

  const onSubmit = async (values) => {
    try {
      await sendMessage(values);
      reset(values, { keepIsSubmitted: true, keepValues: true });
      toast("Message saved. Please also email us directly — see below.", "success");
    } catch (err) {
      toast(err.message ?? "Could not send that message.", "error");
    }
  };

  return (
    <PageShell
      eyebrow="Client services"
      title="How can we assist you?"
      intro="Our client advisors help with orders, returns, sizing and styling. We reply within one working day."
      width="wide"
    >
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.25fr] lg:gap-16 xl:gap-24">
        <div className="space-y-8">
          <Detail icon={Mail} title="Client care">
            <a
              href={`mailto:${contact?.support ?? CONTACT_EMAIL.support}`}
              className="text-gold-700 underline underline-offset-4"
            >
              {contact?.support ?? CONTACT_EMAIL.support}
            </a>
            <p className="mt-1 text-[13px] text-espresso-soft">
              Orders, tracking, returns, shipping and sizing.
            </p>
          </Detail>

          <Detail icon={Mail} title="General enquiries">
            <a
              href={`mailto:${contact?.general ?? CONTACT_EMAIL.general}`}
              className="text-gold-700 underline underline-offset-4"
            >
              {contact?.general ?? CONTACT_EMAIL.general}
            </a>
            <p className="mt-1 text-[13px] text-espresso-soft">
              Press, partnerships, privacy requests and legal.
            </p>
          </Detail>

          {contact?.phone && (
            <Detail icon={Phone} title="Telephone">
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="text-espresso">
                {contact.phone}
              </a>
            </Detail>
          )}

          {contact?.hours && (
            <Detail icon={Clock} title="Hours">
              <p className="text-espresso">{contact.hours}</p>
            </Detail>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="border border-umber-50 p-6 sm:p-8 lg:p-10 xl:p-12">
          <h2 className="font-display text-2xl tracking-wide text-espresso">Send a message</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:mt-8 lg:gap-6">
            <Field label="Name" required error={errors.name?.message}>
              <input {...register("name", { required: "Please tell us your name." })} />
            </Field>

            <Field label="Email" required error={errors.email?.message}>
              <input
                type="email"
                {...register("email", {
                  required: "We need an address to reply to.",
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Check that address." },
                })}
              />
            </Field>

            <Field
              label="What is it about?"
              required
              className="sm:col-span-2"
              error={errors.subject?.message}
              helper={chosen ? `This goes to ${routedTo}.` : undefined}
            >
              <select {...register("subject", { required: "Please choose a subject." })}>
                <option value="">Select a subject</option>
                {SUBJECTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label="Message"
              required
              className="sm:col-span-2"
              error={errors.message?.message}
            >
              <textarea
                rows={8}
                className="min-h-40 resize-y lg:min-h-56"
                {...register("message", {
                  required: "Please tell us how we can help.",
                  minLength: { value: 10, message: "A little more detail, please." },
                })}
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" size="lg" loading={isSubmitting}>
              Send message
            </Button>
          </div>

          {/*
            Honest about what just happened. The form is not connected to a
            mail service yet, and telling someone their message is on its way
            when it is not is the failure mode worth avoiding here.
          */}
          {isSubmitSuccessful && (
            <div className="mt-6 border-l-2 border-gold-500 py-3 pl-5" role="status">
              <p className="text-[13px] leading-relaxed text-espresso-soft">
                <strong className="font-medium text-espresso">Saved on this device.</strong> Our
                contact form is not yet connected to a mail service, so please also write to{" "}
                <a href={`mailto:${routedTo}`} className="text-gold-700 underline underline-offset-4">
                  {routedTo}
                </a>{" "}
                so we receive it.
              </p>
            </div>
          )}
        </form>
      </div>
    </PageShell>
  );
}

function Detail({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center border border-umber-50 text-gold-700">
        <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-espresso">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}
