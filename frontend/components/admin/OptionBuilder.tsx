'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react'

interface OptionChoice {
  value: string
  label: string
  price_modifier?: number
  price?: number
  duration_days?: number
  features?: string[]
}

interface DynamicOption {
  id: string
  type: 'single_select' | 'multi_select' | 'package' | 'number_range' | 'text_input'
  label: string
  description?: string
  required: boolean
  choices?: OptionChoice[]
  min?: number
  max?: number
  step?: number
  default?: number | string
  price_per_unit?: number
  placeholder?: string
}

interface OptionBuilderProps {
  options: DynamicOption[]
  onChange: (options: DynamicOption[]) => void
}

export default function OptionBuilder({ options, onChange }: OptionBuilderProps) {
  const [expandedOption, setExpandedOption] = useState<string | null>(null)

  const addOption = () => {
    const newOption: DynamicOption = {
      id: `option_${Date.now()}`,
      type: 'single_select',
      label: '',
      description: '',
      required: false,
      choices: []
    }
    onChange([...options, newOption])
    setExpandedOption(newOption.id)
  }

  const removeOption = (id: string) => {
    onChange(options.filter(opt => opt.id !== id))
  }

  const updateOption = (id: string, updates: Partial<DynamicOption>) => {
    onChange(options.map(opt => opt.id === id ? { ...opt, ...updates } : opt))
  }

  const addChoice = (optionId: string) => {
    const option = options.find(opt => opt.id === optionId)
    if (!option) return

    const newChoice: OptionChoice = {
      value: `choice_${Date.now()}`,
      label: '',
      price_modifier: option.type === 'package' ? undefined : 0,
      price: option.type === 'package' ? 0 : undefined,
      duration_days: option.type === 'package' ? 0 : undefined,
      features: option.type === 'package' ? [] : undefined
    }

    updateOption(optionId, {
      choices: [...(option.choices || []), newChoice]
    })
  }

  const removeChoice = (optionId: string, choiceIndex: number) => {
    const option = options.find(opt => opt.id === optionId)
    if (!option || !option.choices) return

    updateOption(optionId, {
      choices: option.choices.filter((_, idx) => idx !== choiceIndex)
    })
  }

  const updateChoice = (optionId: string, choiceIndex: number, updates: Partial<OptionChoice>) => {
    const option = options.find(opt => opt.id === optionId)
    if (!option || !option.choices) return

    updateOption(optionId, {
      choices: option.choices.map((choice, idx) =>
        idx === choiceIndex ? { ...choice, ...updates } : choice
      )
    })
  }

  const getOptionTypeLabel = (type: string) => {
    const labels = {
      single_select: 'Chọn 1 (Radio)',
      multi_select: 'Chọn nhiều (Checkbox)',
      package: 'Gói dịch vụ',
      number_range: 'Số lượng (Range)',
      text_input: 'Nhập văn bản'
    }
    return labels[type as keyof typeof labels] || type
  }

  const toggleExpand = (optionId: string) => {
    setExpandedOption(expandedOption === optionId ? null : optionId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Options động cho dự án</h3>
        <button
          type="button"
          onClick={addOption}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm Option
        </button>
      </div>

      {options.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">Chưa có option nào. Click "Thêm Option" để bắt đầu.</p>
        </div>
      )}

      <div className="space-y-3">
        {options.map((option, optionIndex) => (
          <div key={option.id} className="border border-gray-300 rounded-lg bg-white shadow-sm">
            {/* Option Header */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleExpand(option.id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {option.label || `Option ${optionIndex + 1}`}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {getOptionTypeLabel(option.type)}
                    </span>
                    {option.required && (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Bắt buộc</span>
                    )}
                  </div>
                  {option.description && (
                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeOption(option.id)
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {expandedOption === option.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Option Details (Expanded) */}
            {expandedOption === option.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên option *
                    </label>
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => updateOption(option.id, { label: e.target.value })}
                      placeholder="Ví dụ: Ngôn ngữ, Tính năng bổ sung..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại option *
                    </label>
                    <select
                      value={option.type}
                      onChange={(e) => updateOption(option.id, {
                        type: e.target.value as DynamicOption['type'],
                        choices: e.target.value === 'text_input' || e.target.value === 'number_range' ? undefined : (option.choices || [])
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="single_select">Chọn 1 (Radio)</option>
                      <option value="multi_select">Chọn nhiều (Checkbox)</option>
                      <option value="package">Gói dịch vụ</option>
                      <option value="number_range">Số lượng (Range)</option>
                      <option value="text_input">Nhập văn bản</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    value={option.description || ''}
                    onChange={(e) => updateOption(option.id, { description: e.target.value })}
                    placeholder="Mô tả ngắn về option này..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`required-${option.id}`}
                    checked={option.required}
                    onChange={(e) => updateOption(option.id, { required: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`required-${option.id}`} className="ml-2 text-sm text-gray-700">
                    Bắt buộc phải chọn/điền
                  </label>
                </div>

                {/* Type-specific configuration */}
                {(option.type === 'single_select' || option.type === 'multi_select' || option.type === 'package') && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">
                        Các lựa chọn {option.type === 'package' && '(Packages)'}
                      </label>
                      <button
                        type="button"
                        onClick={() => addChoice(option.id)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm lựa chọn
                      </button>
                    </div>

                    {option.choices && option.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="bg-white border border-gray-200 rounded-md p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={choice.label}
                            onChange={(e) => updateChoice(option.id, choiceIndex, { label: e.target.value })}
                            placeholder="Tên lựa chọn"
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeChoice(option.id, choiceIndex)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {option.type === 'package' ? (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                value={choice.price || 0}
                                onChange={(e) => updateChoice(option.id, choiceIndex, { price: Number(e.target.value) })}
                                placeholder="Giá (VNĐ)"
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <input
                                type="number"
                                value={choice.duration_days || 0}
                                onChange={(e) => updateChoice(option.id, choiceIndex, { duration_days: Number(e.target.value) })}
                                placeholder="Thời gian (ngày)"
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <textarea
                              value={(choice.features || []).join('\n')}
                              onChange={(e) => updateChoice(option.id, choiceIndex, {
                                features: e.target.value.split('\n').filter(f => f.trim())
                              })}
                              placeholder="Tính năng (mỗi dòng 1 tính năng)"
                              rows={2}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </>
                        ) : (
                          <input
                            type="number"
                            value={choice.price_modifier || 0}
                            onChange={(e) => updateChoice(option.id, choiceIndex, { price_modifier: Number(e.target.value) })}
                            placeholder="Phụ phí (VNĐ)"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}

                    {(!option.choices || option.choices.length === 0) && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Chưa có lựa chọn nào. Click "Thêm lựa chọn" để thêm.
                      </p>
                    )}
                  </div>
                )}

                {option.type === 'number_range' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
                      <input
                        type="number"
                        value={option.min || 0}
                        onChange={(e) => updateOption(option.id, { min: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
                      <input
                        type="number"
                        value={option.max || 100}
                        onChange={(e) => updateOption(option.id, { max: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bước nhảy</label>
                      <input
                        type="number"
                        value={option.step || 1}
                        onChange={(e) => updateOption(option.id, { step: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá mỗi đơn vị (VNĐ)</label>
                      <input
                        type="number"
                        value={option.price_per_unit || 0}
                        onChange={(e) => updateOption(option.id, { price_per_unit: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {option.type === 'text_input' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={option.placeholder || ''}
                      onChange={(e) => updateOption(option.id, { placeholder: e.target.value })}
                      placeholder="Văn bản gợi ý..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
