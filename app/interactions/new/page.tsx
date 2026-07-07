import { InteractionForm } from "@/components/interaction-form";

export default function NewInteractionPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        New Interaction
      </h1>
      <InteractionForm />
    </div>
  );
}
