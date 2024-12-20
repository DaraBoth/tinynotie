import AutocompleteInput from '@/components/ui/autocompleteInput'
import React from 'react'

const EditMember = () => {
  return (
    <div>
      <AutocompleteInput
            suggestions={[]} // Add relevant suggestions here
            selectedItems={[]}
            onAddItem={(item) => console.log("Add:", item)}
            onRemoveItem={(item) => console.log("Remove:", item)}
          />
    </div>
  )
}

export default EditMember
