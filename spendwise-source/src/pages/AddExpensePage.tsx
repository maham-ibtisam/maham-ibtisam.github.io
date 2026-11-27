import ExpenseForm, { type ExpenseDraft } from '../components/ExpenseForm'
import type { Category } from '../lib/types'

export default function AddExpensePage({
  categories,
  onSave,
  onSaved,
}: {
  categories: Category[]
  onSave: (drafts: ExpenseDraft[]) => void
  onSaved: (message: string) => void
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Add Expense</h2>
        <p className="text-sm text-slate-500">Fast entry — name, amount, done. Add more items to the same transaction with “Add another item”.</p>
      </div>
      <ExpenseForm
        categories={categories}
        submitLabel="Save expense"
        onSave={(drafts) => {
          onSave(drafts)
          onSaved(
            drafts.length === 1
              ? `Saved: ${drafts[0].description} — Rs ${drafts[0].amount.toLocaleString('en-PK')}`
              : `Saved ${drafts.length} items in one transaction.`,
          )
        }}
      />
    </div>
  )
}
