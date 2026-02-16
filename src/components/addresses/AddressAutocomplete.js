'use client';

import { useState, useRef, useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { HiX } from 'react-icons/hi';
import useInputFocusScroll from '@/hooks/useInputFocusScroll';

const libraries = ['places'];

/**
 * AddressAutocomplete Component
 * Uses Google Places PlaceAutocompleteElement (web component) - recommended for new customers
 * This replaces the deprecated Autocomplete API
 */
export default function AddressAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Enter an address',
  label = 'Address',
  helperText = '',
  error = '',
  className = '',
  required = false
}) {
  const handleInputFocus = useInputFocusScroll();
  const [inputValue, setInputValue] = useState(value);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const autocompleteElementRef = useRef(null);
  const containerRef = useRef(null);
  const hiddenInputRef = useRef(null);
  const isUserTypingRef = useRef(false); // Track if user is actively typing
  // Store latest handlers in refs to avoid recreating element when they change
  const onChangeRef = useRef(onChange);
  const onSelectRef = useRef(onSelect);
  
  // Update refs when handlers change (without recreating element)
  useEffect(() => {
    onChangeRef.current = onChange;
    onSelectRef.current = onSelect;
  }, [onChange, onSelect]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // Update value when prop changes externally (but don't interfere with user typing)
  useEffect(() => {
    // Only update if value changed externally and element exists
    // Don't update if user is currently typing (to prevent focus loss)
    if (autocompleteElementRef.current && value !== autocompleteElementRef.current.value) {
      // Don't update if user is actively typing
      if (!isUserTypingRef.current) {
        // Safe to update from external source
        setInputValue(value);
        autocompleteElementRef.current.value = value;
      }
    }
  }, [value]);

  useEffect(() => {
    if (!isLoaded || loadError || !containerRef.current) return;
    
    // Prevent re-initialization if element already exists
    if (autocompleteElementRef.current) {
      return;
    }

    const initPlaceAutocompleteElement = async () => {
      try {
        // Import the places library
        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary('places');
        
        // Double-check element doesn't exist (race condition protection)
        if (autocompleteElementRef.current) {
          return;
        }

        // Create the web component
        // PlaceAutocompleteElement constructor accepts optional PlaceAutocompleteElementOptions
        // Fields are requested when fetching place details, not in constructor
        const autocompleteElement = new PlaceAutocompleteElement({
          types: ['geocode'] // Restrict to addresses only
        });

        // Set initial value
        if (value) {
          autocompleteElement.value = value;
        }

        // Set placeholder
        autocompleteElement.setAttribute('placeholder', placeholder);
        
        // The element will be styled via CSS in globals.css

        // Create a hidden input for form compatibility
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = 'address';
        hiddenInputRef.current = hiddenInput;

        // Append to container
        containerRef.current.appendChild(autocompleteElement);
        containerRef.current.appendChild(hiddenInput);
        
        // Sync value changes (debounced to prevent focus loss)
        let syncTimeout;
        const syncValue = () => {
          const newValue = autocompleteElement.value;
          // Update hidden input immediately
          if (hiddenInput) {
            hiddenInput.value = newValue;
          }
          // Debounce state update to prevent focus loss during typing
          clearTimeout(syncTimeout);
          syncTimeout = setTimeout(() => {
            setInputValue(newValue);
            isUserTypingRef.current = false;
          }, 150);
        };
        
        // Listen for input changes (user typing)
        // Use ref to access latest onChange handler without recreating listener
        const inputHandler = () => {
          isUserTypingRef.current = true;
          syncValue();
          // Get latest onChange handler from ref (not closure to avoid stale closures)
          const latestOnChange = onChangeRef.current;
          // When user types, update formattedAddress
          // Only clear coordinates if input is completely empty
          // This allows user to edit the text without losing coordinates until they clear it
          if (latestOnChange) {
            if (autocompleteElement.value === '') {
              // Input cleared - clear coordinates too
              latestOnChange({ formattedAddress: '', coordinates: null });
            } else {
              // User is typing - update address but keep coordinates if they exist
              // Coordinates will be updated when a place is selected
              latestOnChange({ formattedAddress: autocompleteElement.value });
            }
          }
        };
        
        autocompleteElement.addEventListener('input', inputHandler);
        
        // Also listen for focus/blur to track when user is interacting
        // Try to find the actual input element inside the web component
        const findInputElement = () => {
          // PlaceAutocompleteElement uses shadow DOM, try to access it
          if (autocompleteElement.shadowRoot) {
            return autocompleteElement.shadowRoot.querySelector('input');
          }
          // Fallback: try direct query
          return autocompleteElement.querySelector('input');
        };
        
        const focusHandler = () => {
          isUserTypingRef.current = true;
        };
        const blurHandler = () => {
          // Small delay to allow for selection events
          setTimeout(() => {
            isUserTypingRef.current = false;
          }, 200);
        };
        
        // Try to attach focus/blur handlers
        // Use a small delay to ensure shadow DOM is ready
        setTimeout(() => {
          const inputElement = findInputElement();
          if (inputElement) {
            inputElement.addEventListener('focus', focusHandler);
            inputElement.addEventListener('blur', blurHandler);
            autocompleteElementRef.current._inputElement = inputElement;
          }
        }, 200);
        
        // Listen for place selection
        // Correct event name is 'gmp-select', not 'gmp-placeselect'
        const selectHandler = async (event) => {
          const { placePrediction } = event;
          
          console.log('Place prediction selected:', placePrediction);
          
          if (!placePrediction) {
            console.error('No place prediction in event');
            return;
          }

          setIsGeocoding(true);

          try {
            // Convert placePrediction to Place object
            const place = placePrediction.toPlace();
            
            // Fetch additional fields we need (using camelCase field names for new Places API)
            // fetchFields modifies the place object in place and returns it
            await place.fetchFields({
              fields: ['formattedAddress', 'location', 'addressComponents', 'id']
            });
            
            console.log('Place object after fetchFields:', place);
            console.log('Place location:', place.location);
            console.log('Place addressComponents:', place.addressComponents);
            console.log('Place formattedAddress:', place.formattedAddress);
            console.log('Place id:', place.id);

            // Extract address components
            // Handle both old API format (long_name/short_name) and new API format (longText/shortText)
            const addressComponents = {};
            const streetParts = [];
            
            // Access addressComponents directly from place object
            place.addressComponents?.forEach(component => {
              const types = component.types || [];
              // Get text value - try new API format first, then fall back to old format
              const longText = component.longText || component.longName || component.long_name;
              const shortText = component.shortText || component.shortName || component.short_name;
              
              if (types.includes('street_number')) {
                streetParts.unshift(longText);
              } else if (types.includes('route')) {
                streetParts.push(longText);
              } else if (types.includes('locality')) {
                addressComponents.city = longText;
              } else if (types.includes('country')) {
                addressComponents.country = shortText;
              } else if (types.includes('postal_code')) {
                addressComponents.postalCode = longText;
              }
            });
            
            if (streetParts.length > 0) {
              addressComponents.street = streetParts.join(' ');
            }

            // Extract coordinates from location
            // Access location directly from place object
            const location = place.location;
            if (!location) {
              console.error('No location found in place object');
              setIsGeocoding(false);
              return;
            }
            
            // Location is a LatLng object, extract lat/lng
            const lat = typeof location.lat === 'function' ? location.lat() : location.lat;
            const lng = typeof location.lng === 'function' ? location.lng() : location.lng;
            
            if (typeof lat !== 'number' || typeof lng !== 'number') {
              console.error('Invalid coordinates:', { lat, lng, location });
              setIsGeocoding(false);
              return;
            }
            
            const addressData = {
              formattedAddress: place.formattedAddress || '',
              coordinates: {
                latitude: lat,
                longitude: lng
              },
              addressComponents,
              placeId: place.id || ''
            };

            const finalAddress = addressData.formattedAddress;
            setInputValue(finalAddress);
            autocompleteElement.value = finalAddress;
            if (hiddenInput) {
              hiddenInput.value = finalAddress;
            }
            setIsGeocoding(false);

            // Call onChange with complete address data (including coordinates)
            // Get latest handlers from refs
            const latestOnChange = onChangeRef.current;
            const latestOnSelect = onSelectRef.current;
            
            console.log('Calling onChange with addressData:', addressData);
            if (latestOnChange) {
              latestOnChange(addressData);
            }
            if (latestOnSelect) {
              latestOnSelect(place);
            }
          } catch (err) {
            console.error('Error fetching place details:', err);
            setIsGeocoding(false);
          }
        };
        
        autocompleteElement.addEventListener('gmp-select', selectHandler);

        autocompleteElementRef.current = autocompleteElement;
        
        // Store handlers for cleanup
        autocompleteElementRef.current._inputHandler = inputHandler;
        autocompleteElementRef.current._selectHandler = selectHandler;
        autocompleteElementRef.current._focusHandler = focusHandler;
        autocompleteElementRef.current._blurHandler = blurHandler;
        autocompleteElementRef.current._syncTimeout = syncTimeout;
      } catch (err) {
        console.error('Error initializing PlaceAutocompleteElement:', err);
      }
    };

    // Initialize with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initPlaceAutocompleteElement, 100);

    return () => {
      clearTimeout(timeoutId);
      // Clean up sync timeout
      if (autocompleteElementRef.current?._syncTimeout) {
        clearTimeout(autocompleteElementRef.current._syncTimeout);
      }
      // Clean up event listeners and element only on unmount
      if (autocompleteElementRef.current) {
        if (autocompleteElementRef.current._inputHandler) {
          autocompleteElementRef.current.removeEventListener('input', autocompleteElementRef.current._inputHandler);
        }
        if (autocompleteElementRef.current._selectHandler) {
          autocompleteElementRef.current.removeEventListener('gmp-select', autocompleteElementRef.current._selectHandler);
        }
        // Clean up focus/blur handlers on input element
        if (autocompleteElementRef.current._inputElement) {
          if (autocompleteElementRef.current._focusHandler) {
            autocompleteElementRef.current._inputElement.removeEventListener('focus', autocompleteElementRef.current._focusHandler);
          }
          if (autocompleteElementRef.current._blurHandler) {
            autocompleteElementRef.current._inputElement.removeEventListener('blur', autocompleteElementRef.current._blurHandler);
          }
        }
        if (autocompleteElementRef.current.parentNode) {
          autocompleteElementRef.current.parentNode.removeChild(autocompleteElementRef.current);
        }
        autocompleteElementRef.current = null;
      }
      if (hiddenInputRef.current && hiddenInputRef.current.parentNode) {
        hiddenInputRef.current.parentNode.removeChild(hiddenInputRef.current);
        hiddenInputRef.current = null;
      }
    };
  }, [isLoaded, loadError]); // Only re-init if loading state changes, not on every prop change

  const handleClear = () => {
    setInputValue('');
    if (autocompleteElementRef.current) {
      autocompleteElementRef.current.value = '';
      autocompleteElementRef.current.focus();
    }
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = '';
    }
    if (onChange) {
      onChange({ formattedAddress: '' });
    }
  };

  if (loadError) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (onChange) onChange({ formattedAddress: e.target.value });
          }}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-base sm:text-lg bg-background-card dark:bg-background-card text-text-primary dark:text-text-primary border border-semantic-error-200 dark:border-semantic-error-700 rounded-lg ${className}`}
          disabled
        />
        <p className="text-xs text-semantic-error-600 dark:text-semantic-error-400">
          {error || 'Unable to load address autocomplete. Please check your Google Maps API key.'}
        </p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full px-3 py-2 text-base sm:text-lg bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg animate-pulse">
          Loading address autocomplete...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative" ref={containerRef}>
        {/* Loading spinner - positioned to not overlap with PlaceAutocompleteElement's clear button */}
        {isGeocoding && (
          <div className="absolute right-12 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        )}
      </div>
      {helperText && (
        <p className="text-xs text-text-tertiary dark:text-text-tertiary mt-1">
          {helperText}
        </p>
      )}
      {error && (
        <div className="mt-2 p-2 bg-semantic-error-50 dark:bg-semantic-error-900 border border-semantic-error-200 dark:border-semantic-error-700 rounded text-xs text-semantic-error-600 dark:text-semantic-error-400">
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
