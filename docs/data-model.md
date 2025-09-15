# Data Model for VaksineApp

## DataVerse Table Structure

### 1. Vaccine Records Table
**Table Name**: `cr_vaccinerecords`

| Column Name | Data Type | Description | Required |
|-------------|-----------|-------------|----------|
| cr_vaccinerecordid | GUID | Primary Key | Yes |
| cr_patientid | Lookup | Reference to Patient | Yes |
| cr_vaccinetypeid | Lookup | Reference to Vaccine Type | Yes |
| cr_vaccinationdate | Date | Date of vaccination | Yes |
| cr_lotnumber | Text | Vaccine lot number | No |
| cr_healthcareproviderid | Lookup | Reference to Healthcare Provider | Yes |
| cr_dosage | Number | Vaccine dosage | No |
| cr_sideeffects | Text | Recorded side effects | No |
| cr_notes | Text | Additional notes | No |
| cr_createdby | Lookup | User who created record | Yes |
| cr_createdon | DateTime | Creation timestamp | Yes |

### 2. Patients Table
**Table Name**: `cr_patients`

| Column Name | Data Type | Description | Required |
|-------------|-----------|-------------|----------|
| cr_patientid | GUID | Primary Key | Yes |
| cr_firstname | Text | Patient first name | Yes |
| cr_lastname | Text | Patient last name | Yes |
| cr_dateofbirth | Date | Patient date of birth | Yes |
| cr_personnummer | Text | Norwegian personal number | Yes |
| cr_phone | Text | Contact phone number | No |
| cr_email | Text | Contact email | No |
| cr_address | Text | Patient address | No |
| cr_emergencycontact | Text | Emergency contact information | No |
| cr_medicalconditions | Text | Known medical conditions | No |
| cr_allergies | Text | Known allergies | No |
| cr_createdby | Lookup | User who created record | Yes |
| cr_createdon | DateTime | Creation timestamp | Yes |

### 3. Vaccine Types Table
**Table Name**: `cr_vaccinetypes`

| Column Name | Data Type | Description | Required |
|-------------|-----------|-------------|----------|
| cr_vaccinetypeid | GUID | Primary Key | Yes |
| cr_vaccinename | Text | Name of vaccine | Yes |
| cr_manufacturer | Text | Vaccine manufacturer | Yes |
| cr_disease | Text | Disease the vaccine prevents | Yes |
| cr_dosageform | Text | Form of vaccine (injection, oral, etc.) | Yes |
| cr_storageconditions | Text | Storage requirements | No |
| cr_expirydays | Number | Days until expiry | No |
| cr_contraindications | Text | Medical contraindications | No |
| cr_isactive | Yes/No | Whether vaccine is currently available | Yes |

### 4. Healthcare Providers Table
**Table Name**: `cr_healthcareproviders`

| Column Name | Data Type | Description | Required |
|-------------|-----------|-------------|----------|
| cr_healthcareproviderid | GUID | Primary Key | Yes |
| cr_providername | Text | Name of healthcare provider | Yes |
| cr_providertype | Choice | Type (Doctor, Nurse, Clinic, Hospital) | Yes |
| cr_license | Text | Professional license number | No |
| cr_phone | Text | Contact phone | No |
| cr_email | Text | Contact email | No |
| cr_address | Text | Provider address | No |
| cr_specialization | Text | Medical specialization | No |
| cr_isactive | Yes/No | Whether provider is active | Yes |

### 5. Appointments Table
**Table Name**: `cr_appointments`

| Column Name | Data Type | Description | Required |
|-------------|-----------|-------------|----------|
| cr_appointmentid | GUID | Primary Key | Yes |
| cr_patientid | Lookup | Reference to Patient | Yes |
| cr_healthcareproviderid | Lookup | Reference to Healthcare Provider | Yes |
| cr_vaccinetypeid | Lookup | Reference to Vaccine Type | Yes |
| cr_appointmentdate | DateTime | Scheduled appointment date/time | Yes |
| cr_status | Choice | Status (Scheduled, Completed, Cancelled, No-show) | Yes |
| cr_notes | Text | Appointment notes | No |
| cr_remindersent | Yes/No | Whether reminder was sent | No |

## Relationships

### One-to-Many Relationships
- Patient → Vaccine Records (1:N)
- Patient → Appointments (1:N)
- Vaccine Type → Vaccine Records (1:N)
- Vaccine Type → Appointments (1:N)
- Healthcare Provider → Vaccine Records (1:N)
- Healthcare Provider → Appointments (1:N)

### Many-to-Many Relationships
- Patients ↔ Healthcare Providers (through appointments)

## Business Rules

### Data Validation
1. **Personnummer Validation**: Norwegian personal number format validation
2. **Date Validation**: Vaccination date cannot be in the future
3. **Age Validation**: Minimum age requirements for certain vaccines
4. **Duplicate Prevention**: Prevent duplicate vaccination records for same vaccine type within specified timeframe

### Security Rules
1. **Patient Data Access**: Patients can only view their own records
2. **Provider Access**: Healthcare providers can only access their own patients
3. **Admin Access**: System administrators have full access
4. **Audit Trail**: All data modifications are logged

## Integration Points

### Entra ID Integration
- User authentication and authorization
- Role-based access control
- Single sign-on capabilities

### External Systems
- **FHI (Folkehelseinstituttet)**: Norwegian Institute of Public Health integration
- **SYSVAK**: Norwegian vaccination registry
- **Electronic Health Records**: Integration with existing EHR systems
