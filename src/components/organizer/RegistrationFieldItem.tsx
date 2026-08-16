import React from "react";
import { Reorder } from "framer-motion";
import {
  GripVertical,
  ChevronDown,
  Trash2,
  Plus,
  Info,
  X
} from "lucide-react";
import { RegistrationField } from "@/types";

interface RegistrationFieldItemProps {
  field: RegistrationField;
  idx: number;
  isLocationField: boolean;
  showPreview: boolean;
  registration: { fields: RegistrationField[]; isGroupingEnabled?: boolean };
  updateField: (index: number, field: string, value: string | boolean | string[] | undefined) => void;
  removeField: (index: number) => void;
  addFieldOption: (fieldIdx: number) => void;
  updateFieldOption: (fieldIdx: number, optionIdx: number, value: string) => void;
  removeFieldOption: (fieldIdx: number, optionIdx: number) => void;
  onBlur?: () => void;
}

export const RegistrationFieldItem = ({
  field,
  idx,
  isLocationField,
  showPreview,
  registration,
  updateField,
  removeField,
  addFieldOption,
  updateFieldOption,
  removeFieldOption,
  onBlur
}: RegistrationFieldItemProps) => {
  const isOrganizationField = field.label.toLowerCase() === "organization" || field.name?.toLowerCase() === "organization";
  const isGroupNameField = field.source === 'GROUP_NAME';

  return (
    <Reorder.Item key={field.id || field.name || field.label} value={field}>
      <div className={`p-6 bg-gray-50 rounded-[2.5rem] group relative border-2 border-gray-300 hover:border-primary transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 flex flex-col ${showPreview ? "gap-4 xl:gap-6" : "gap-6 lg:flex-row lg:items-center lg:gap-8"}`}>
        <div className="flex absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-white rounded-lg border border-gray-100 shadow-sm items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-primary transition-colors z-10">
          <GripVertical size={20} />
        </div>
        <div className={`flex items-center gap-4 ${showPreview ? "w-full flex-col xl:flex-row xl:gap-6" : "flex-1 flex-col lg:flex-row lg:gap-8"}`}>
          <div className={`space-y-2 ${showPreview ? "w-full xl:flex-[1.5] min-w-0" : "w-full flex-[2]"}`}>
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Field Label</label>
            <input
              type="text"
              placeholder="e.g., Job Title"
              disabled={isLocationField || isGroupNameField}
              className={`w-full p-3.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold focus:border-primary transition-all outline-none ${isLocationField || isGroupNameField ? 'opacity-60 cursor-not-allowed' : ''}`}
              value={field.label}
              onBlur={onBlur}
              onChange={(e) => updateField(idx, "label", e.target.value)}
            />
          </div>
          <div className={`space-y-2 ${showPreview ? "w-full xl:flex-1 min-w-0" : "w-full flex-1"}`}>
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Input Type</label>
            <div className="relative">
              <select
                disabled={isLocationField || isGroupNameField}
                className={`w-full p-3.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold appearance-none outline-none focus:border-primary transition-all ${isLocationField || isGroupNameField ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={field.type}
                onBlur={onBlur}
                onChange={(e) => updateField(idx, "type", e.target.value)}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-6 ${showPreview ? "justify-start pl-1 w-full xl:w-auto" : "flex-1 justify-around px-6 h-16 bg-white/50 rounded-xl border border-gray-100"}`}>
          <label className="flex items-center gap-3 cursor-pointer group/toggle">
            <input
              type="checkbox"
              checked={field.required}
              onBlur={onBlur}
              onChange={(e) => updateField(idx, "required", e.target.checked)}
              className="w-6 h-6 rounded-lg border-gray-200 text-primary cursor-pointer shadow-sm transition-all"
            />
            <span className="text-[10px] font-black text-gray-400 group-hover/toggle:text-gray-900 uppercase tracking-widest transition-colors">Mandatory</span>
          </label>
          <div className="relative inline-block group/tooltip">
            <div className="flex items-center gap-2">
              <label
                className={`flex items-center gap-3 group/toggle ${(!registration.isGroupingEnabled || isOrganizationField) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
              >
                <input
                  type="checkbox"
                  disabled={!registration.isGroupingEnabled || isOrganizationField}
                  checked={field.isPerAttendee}
                  onBlur={onBlur}
                  onChange={(e) => updateField(idx, "isPerAttendee", e.target.checked)}
                  className="w-6 h-6 rounded-lg border-gray-200 text-primary cursor-pointer shadow-sm transition-all"
                />
                <span className="text-[10px] font-black text-gray-400 group-hover/toggle:text-gray-900 uppercase tracking-widest transition-colors">
                  Collect this for every attendee.
                </span>
              </label>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="text-gray-400 hover:text-primary focus:text-primary transition-colors focus:outline-none shrink-0 cursor-help"
              >
                <Info size={14} />
              </button>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block bg-gray-900 text-white text-[10px] font-bold rounded-xl p-3 w-64 z-[110] shadow-xl pointer-events-none text-left leading-relaxed">
              {!registration.isGroupingEnabled ? (
                "Enable 'Allow Grouping' to collect details per attendee."
              ) : isOrganizationField ? (
                "Organization details are collected per group."
              ) : (
                <>
                  <p className="font-extrabold text-white mb-1">When enabled:</p>
                  <p className="text-gray-300 font-normal mb-2">Every attendee in the registration group must answer this question.</p>
                  <p className="font-extrabold text-white mb-1">When disabled:</p>
                  <p className="text-gray-300 font-normal">Only the group organizer answers it once.</p>
                </>
              )}
            </div>
          </div>
        </div>

        {!isGroupNameField && (
          <button
            onClick={() => removeField(idx)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 text-gray-300 hover:text-secondary rounded-xl flex items-center justify-center shadow-sm border border-gray-100 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 z-10"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {(field.type === 'select' || field.type === 'checkbox') && (
        <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 mt-2 ml-4 mr-4 space-y-5">
          {!isLocationField && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {field.source ? "Auto-Managed" : "Your Options"}
                </p>
                {!field.source && (
                  <button
                    onClick={() => addFieldOption(idx)}
                    className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20 hover:bg-primary/25 transition-all shadow-sm"
                  >
                    <Plus size={12} strokeWidth={3} /> Add Option
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {field.source ? (
                  <div className="flex items-center gap-2.5 p-3.5 bg-primary/5 rounded-xl border border-primary/10 w-full">
                    <Info size={14} className="text-primary shrink-0" />
                    <p className="text-[9px] font-semibold text-primary/80 leading-relaxed uppercase tracking-wider">
                      Pops from {field.source}.
                      {field.dependsOn && <span> Linked to {field.dependsOn}.</span>}
                    </p>
                  </div>
                ) : (
                  <>
                    {(field.options || []).map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm group/opt transition-all hover:border-primary/30 flex-1 min-w-[200px] max-w-full">
                        <input
                          type="text"
                          value={opt}
                          onBlur={onBlur}
                          onChange={(e) => updateFieldOption(idx, oIdx, e.target.value)}
                          placeholder="Option Name"
                          className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 w-full min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => removeFieldOption(idx, oIdx)}
                          className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 transition-all cursor-pointer"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    {(field.options || []).length === 0 && (
                      <p className="text-xs text-gray-400 italic px-1">Add options for your guests to select.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {!isLocationField && field.type === 'checkbox' && (
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10 mt-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-gray-900">Select Multiple Options</p>
                <p className="text-[10px] font-medium text-gray-400 leading-relaxed">Allows guests to select more than one choice during registration</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!field.multiple}
                  onBlur={onBlur}
                  onChange={(e) => updateField(idx, "multiple", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          )}
        </div>
      )}
    </Reorder.Item>
  );
};
