'use client';

import {useEffect, useMemo, useState} from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {Button, Select} from 'flowbite-react';
import {db} from 'firebaseConfig';
import {useAuth} from '@/utils/auth/AuthContext';
import {useLocale, useTranslations} from 'next-intl';
import {countries} from 'countries-list';
import {getSkillsForSelect} from '@/utils/crudSkills';
import {sdgNames} from '@/constant/sdgs';

/**
 * Alert manager for members/{userId}/alerts.
 * Simplified tag-based multi-select UI.
 */
export default function AlertManager() {
  const {user} = useAuth();
  const locale = useLocale();
  const t = useTranslations('ActivityAlerts');

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadingSkills, setLoadingSkills] = useState(false);

  const [label, setLabel] = useState('');
  const [frequency, setFrequency] = useState('daily');

  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedSdgs, setSelectedSdgs] = useState([]);

  const [typeDraft, setTypeDraft] = useState('online');
  const [countryDraft, setCountryDraft] = useState('');
  const [skillDraft, setSkillDraft] = useState('');
  const [sdgDraft, setSdgDraft] = useState('');

  const [skillLabelMap, setSkillLabelMap] = useState({});

  const alertsCollectionRef = useMemo(() => {
    if (!user?.uid) return null;
    return collection(db, 'members', user.uid, 'alerts');
  }, [user?.uid]);

  const typeOptions = useMemo(
      () => [
        {value: 'online', label: t('typeOnline')},
        {value: 'local', label: t('typeLocal')},
        {value: 'event', label: t('typeEvent')},
      ],
      [t],
  );

  const countryOptions = useMemo(
      () =>
        Object.entries(countries)
            .map(([code, data]) => ({value: code, label: data.name}))
            .sort((a, b) => a.label.localeCompare(b.label, locale)),
      [locale],
  );

  const sdgOptions = useMemo(
      () =>
        Object.keys(sdgNames).map((id) => ({
          value: id,
          label: t('sdgLabel', {num: id, name: sdgNames[id]}),
        })),
      [t],
  );

  const skillOptions = useMemo(() =>
    Object.entries(skillLabelMap)
        .map(([value, labelText]) => ({value, label: labelText}))
        .sort((a, b) => a.label.localeCompare(b.label)), [skillLabelMap]);

  useEffect(() => {
    const loadSkillLabels = async () => {
      setLoadingSkills(true);
      try {
        const groups = await getSkillsForSelect(locale);
        const flat = groups.flatMap((group) => group.options || []);
        const map = {};
        for (const skill of flat) {
          map[skill.value] = skill.label;
        }
        setSkillLabelMap(map);
        if (!skillDraft && flat.length > 0) {
          setSkillDraft(flat[0].value);
        }
      } catch (err) {
        console.error('Failed to load skills for alerts:', err);
      } finally {
        setLoadingSkills(false);
      }
    };
    loadSkillLabels();
  }, [locale]);

  useEffect(() => {
    if (!countryDraft && countryOptions.length > 0) {
      setCountryDraft(countryOptions[0].value);
    }
  }, [countryDraft, countryOptions]);

  useEffect(() => {
    if (!sdgDraft && sdgOptions.length > 0) {
      setSdgDraft(sdgOptions[0].value);
    }
  }, [sdgDraft, sdgOptions]);

  const loadAlerts = async () => {
    if (!alertsCollectionRef) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const snap = await getDocs(alertsCollectionRef);
      const next = snap.docs.map((alertDoc) => ({
        id: alertDoc.id,
        ...alertDoc.data(),
      }));
      setAlerts(next);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError(t('errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [alertsCollectionRef]);

  const addTag = (setter, value) => {
    if (!value) return;
    setter((prev) => (prev.includes(value) ? prev : [...prev, value]));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!alertsCollectionRef) return;

    const cleanLabel = label.trim();
    if (!cleanLabel) {
      setError(t('errorLabelRequired'));
      return;
    }

    const criteria = [];
    if (selectedTypes.length > 0) {
      criteria.push({field: 'type', value: selectedTypes});
    }
    if (selectedCountries.length > 0) {
      criteria.push({field: 'country', value: selectedCountries});
    }
    if (selectedSkills.length > 0) {
      criteria.push({field: 'skills', value: selectedSkills});
    }
    if (selectedSdgs.length > 0) {
      criteria.push({field: 'sdg', value: selectedSdgs});
    }

    if (criteria.length < 1) {
      setError(t('errorTagsRequired'));
      return;
    }

    setSaving(true);
    setError('');
    try {
      await addDoc(alertsCollectionRef, {
        label: cleanLabel,
        frequency,
        logic: 'ALL',
        criteria,
        active: true,
        created_at: serverTimestamp(),
        last_run_at: null,
      });
      setLabel('');
      setFrequency('daily');
      setSelectedTypes([]);
      setSelectedCountries([]);
      setSelectedSkills([]);
      setSelectedSdgs([]);
      await loadAlerts();
    } catch (err) {
      console.error('Failed to save alert:', err);
      setError(t('errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (alertId) => {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, 'members', user.uid, 'alerts', alertId));
      await loadAlerts();
    } catch (err) {
      console.error('Failed to delete alert:', err);
      setError(t('errorDelete'));
    }
  };

  const handleToggleActive = async (alertId, current) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'members', user.uid, 'alerts', alertId), {
        active: !current,
      });
      await loadAlerts();
    } catch (err) {
      console.error('Failed to toggle alert status:', err);
      setError(t('errorToggle'));
    }
  };

  const criterionFieldLabel = (field) => {
    if (field === 'type') return t('fieldType');
    if (field === 'country') return t('fieldCountry');
    if (field === 'skills') return t('fieldSkills');
    if (field === 'sdg') return t('fieldSdg');
    return field;
  };

  const resolveTagLabel = (field, value) => {
    if (field === 'type') {
      return typeOptions.find((item) => item.value === value)?.label || value;
    }
    if (field === 'country') {
      return countries[value]?.name || value;
    }
    if (field === 'skills') {
      return skillLabelMap[value] || value;
    }
    if (field === 'sdg') {
      return t('sdgLabel', {num: value, name: sdgNames[value] || ''});
    }
    return value;
  };

  const TagList = ({items, onRemove}) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item) => (
        <span
          key={item.value}
          className="inline-flex items-center gap-1 rounded-full border border-[#009AA2]/30 bg-[#009AA2]/10 px-2.5 py-1 text-xs text-[#007a80]"
        >
          {item.label}
          <button
            type="button"
            onClick={() => onRemove(item.value)}
            className="ml-1 text-[#007a80] hover:text-[#005b5f]"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark rounded-xl shadow-sm p-5">
        <h2 className="text-xl font-semibold text-text-primary dark:text-text-primary mb-4">
          {t('title')}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-1">
              {t('labelField')}
            </label>
            <input
              className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 px-3 py-2 text-sm text-text-primary dark:text-text-primary"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('labelPlaceholder')}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-1">
                {t('frequencyLabel')}
              </label>
              <Select
                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 px-3 py-2 text-sm text-text-primary dark:text-text-primary"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">{t('frequencyDaily')}</option>
                <option value="weekly">{t('frequencyWeekly')}</option>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-text-primary dark:text-text-primary">
              {t('filtersHeading')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterActivityType')}
                </label>
                <div className="flex gap-2">
                  <Select value={typeDraft} onChange={(e) => setTypeDraft(e.target.value)}>
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                  <Button size="xs" onClick={() => addTag(setSelectedTypes, typeDraft)}>{t('add')}</Button>
                </div>
                <TagList
                  items={selectedTypes.map((value) => ({
                    value,
                    label: typeOptions.find((item) => item.value === value)?.label || value,
                  }))}
                  onRemove={(value) => setSelectedTypes((prev) => prev.filter((v) => v !== value))}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterCountry')}
                </label>
                <div className="flex gap-2">
                  <Select value={countryDraft} onChange={(e) => setCountryDraft(e.target.value)}>
                    {countryOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                  <Button size="xs" onClick={() => addTag(setSelectedCountries, countryDraft)}>{t('add')}</Button>
                </div>
                <TagList
                  items={selectedCountries.map((value) => ({value, label: countries[value]?.name || value}))}
                  onRemove={(value) => setSelectedCountries((prev) => prev.filter((v) => v !== value))}
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterSdg')}
                </label>
                <div className="flex gap-2">
                  <Select value={sdgDraft} onChange={(e) => setSdgDraft(e.target.value)}>
                    {sdgOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                  <Button size="xs" onClick={() => addTag(setSelectedSdgs, sdgDraft)}>{t('add')}</Button>
                </div>
                <TagList
                  items={selectedSdgs.map((value) => ({
                    value,
                    label: t('sdgLabel', {num: value, name: sdgNames[value]}),
                  }))}
                  onRemove={(value) => setSelectedSdgs((prev) => prev.filter((v) => v !== value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-text-primary dark:text-text-primary">
                  {t('filterSkills')}
                </label>
                <div className="flex gap-2">
                  <Select
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    disabled={loadingSkills || skillOptions.length === 0}
                  >
                    {skillOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </Select>
                  <Button
                    size="xs"
                    disabled={!skillDraft || loadingSkills}
                    onClick={() => addTag(setSelectedSkills, skillDraft)}
                  >
                    {t('add')}
                  </Button>
                </div>
                <TagList
                  items={selectedSkills.map((value) => ({value, label: skillLabelMap[value] || value}))}
                  onRemove={(value) => setSelectedSkills((prev) => prev.filter((v) => v !== value))}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium bg-[#009AA2] text-white hover:opacity-90 disabled:opacity-60"
          >
            {saving ? t('saving') : t('saveAlert')}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary">
          {t('yourAlerts')}
        </h3>
        {loading ? (
          <div className="text-sm text-text-secondary dark:text-text-secondary">
            {t('loading')}
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-light dark:border-border-dark p-6 text-sm text-text-secondary dark:text-text-secondary">
            {t('emptyState')}
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-background-card dark:bg-background-card border border-border-light dark:border-border-dark rounded-xl shadow-sm p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="font-semibold text-text-primary dark:text-text-primary">
                  {alert.label}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-[#009AA2]/10 text-[#009AA2]">
                    {alert.frequency === 'weekly' ? t('frequencyWeekly') : t('frequencyDaily')}
                  </span>
                </div>
              </div>

              <ul className="space-y-1 mb-4">
                {(alert.criteria || []).map((criterion, idx) => (
                  <li key={`${alert.id}-criterion-${idx}`} className="text-sm text-text-secondary dark:text-text-secondary">
                    <span className="font-medium text-text-primary dark:text-text-primary">{criterionFieldLabel(criterion.field)}:</span>{' '}
                    {Array.isArray(criterion.value) ?
                      criterion.value.map((value) => resolveTagLabel(criterion.field, value)).join(', ') :
                      resolveTagLabel(criterion.field, criterion.value)}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleActive(alert.id, alert.active)}
                  className={`text-xs px-3 py-1.5 rounded-md border ${
                    alert.active ?
                      'border-[#51AC31] text-[#51AC31]' :
                      'border-gray-400 text-gray-500'
                  }`}
                >
                  {alert.active ? t('active') : t('inactive')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(alert.id)}
                  className="text-xs px-3 py-1.5 rounded-md border border-[#CD1436] text-[#CD1436]"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
