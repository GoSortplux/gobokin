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
          <label
            className={`flex items-center gap-3 group/toggle ${(!registration.isGroupingEnabled || isOrganizationField) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            title={!registration.isGroupingEnabled ? "Enable 'Allow Grouping' to collect details per attendee" : isOrganizationField ? "Organization details are collected per group" : ""}
          >
            <input
              type="checkbox"
              disabled={!registration.isGroupingEnabled || isOrganizationField}
              checked={field.isPerAttendee}
              onBlur={onBlur}
              onChange={(e) => updateField(idx, "isPerAttendee", e.target.checked)}
              className="w-6 h-6 rounded-lg border-gray-200 text-primary cursor-pointer shadow-sm transition-all"
            />
            <span className="text-[10px] font-black text-gray-400 group-hover/toggle:text-gray-900 uppercase tracking-widest transition-colors">Per Attendee</span>
          </label>
        </div>

        {!isGroupNameField && (
          <button
            onClick={() => removeField(idx)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/80 text-gray-300 hover:text-secondary rounded-xl flex items-center justify-center shadow-sm border border-gray-100 transition-all opacity-0 group-hover:opacity-100 z-10"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {(field.type === 'select' || field.type === 'checkbox') && (
        <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 mt-2 ml-4 mr-4 space-y-5">
          {!isLocationField && field.type === 'select' && (
            <div className={`grid gap-5 ${showPreview ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Choice Source</label>
                <div className="relative">
                  <select
                    className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold appearance-none outline-none focus:border-primary transition-all shadow-sm"
                    value={field.source === "LGAS" ? (field.label === "City" ? "CITY" : "LGAS") : (field.source || "")}
                    onBlur={onBlur}
                    onChange={(e) => {
                      const newSource = e.target.value || undefined;
                      updateField(idx, "source", newSource);
                      if (newSource) {
                        updateField(idx, "options", []);
                      }
                    }}
                  >
                    <option value="">Manual Entry</option>
                    <option value="COUNTRIES">Countries</option>
                    <option value="STATES">States</option>
                    <option value="LGAS">LGAs</option>
                    <option value="CITY">City</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {field.source && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Link to Field</label>
                  <div className="relative">
                    <select
                      className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold appearance-none outline-none focus:border-primary transition-all shadow-sm"
                      value={field.dependsOn || ""}
                      onBlur={onBlur}
                      onChange={(e) => updateField(idx, "dependsOn", e.target.value || undefined)}
                    >
                      <option value="">Independent</option>
                      {registration.fields
                        .filter((f, i) => i !== idx && (f.type === 'select' || f.type === 'text'))
                        .map((f, i) => (
                          <option key={i} value={f.name || f.label.toLowerCase().replace(/\s+/g, '-')}>
                            {f.label || `Field ${i + 1}`}
                          </option>
                        ))
                      }
                    </select>
                    <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLocationField && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  {field.source ? "Auto-Managed" : "Your Options"}
                </p>
                {!field.source && (
                  <button
                    onClick={() => addFieldOption(idx)}
                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                  >
                    <Plus size={10} strokeWidth={3} /> Add
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2.5">
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
                      <div key={oIdx} className="flex items-center gap-1.5 bg-white p-1.5 pl-3 rounded-lg border border-gray-100 shadow-sm group/opt transition-all hover:border-primary/20">
                        <input
                          type="text"
                          value={opt}
                          onBlur={onBlur}
                          onChange={(e) => updateFieldOption(idx, oIdx, e.target.value)}
                          placeholder="Option"
                          className="bg-transparent border-none outline-none text-[10px] font-bold text-gray-600 w-20"
                        />
                        <button
                          onClick={() => removeFieldOption(idx, oIdx)}
                          className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-secondary transition-all"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    {(field.options || []).length === 0 && (
                      <p className="text-[9px] text-gray-400 italic px-1">Add options for your guests to select.</p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Reorder.Item>
  );
};
