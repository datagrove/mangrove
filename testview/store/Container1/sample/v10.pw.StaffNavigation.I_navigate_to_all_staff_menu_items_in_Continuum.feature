@Navigation
Feature: StaffNavigation

#Uses the classname CommunityLink
Scenario Outline: I navigate to all staff menu items in Community
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Community with className CommunityLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel        | SecondLevel     | ExpectedPage                           |
	| Dashboard         |                 | Community_dashboard.aspx               |
	| Engagement        | Overall         | Engagement/Engagement_dashboard.aspx   |
	| Engagement        | Organizations   | Organization/Engagement_dashboard.aspx |
	| Find contacts     |                 | Directory.aspx                         |
	| Add contact       |                 | Create_Contact_Person_or_Org.aspx      |
	| Data integrity    |                 | Data_integrity_dashboard.aspx          |
	| Manage duplicates |                 | Manage_Duplicates.aspx                 |
	| Committees        |                 | CommitteeListDisplay.aspx              |
	| Communities       |                 | Communities_Dashboard.aspx             |
	| Volunteers        | Dashboard       | Volunteers_dashboard.aspx              |
	| Volunteers        | Find volunteers | Find_volunteers.aspx                   |
	| Groups            |                 | Find_Groups.aspx                       |
	| Import contacts   |                 | Contact-importer.aspx                  |
	| Security          | Users           | FindUser.aspx                          |
	| Security          | Roles           | RoleList.aspx                          |

Scenario Outline: I navigate to all staff menu items in Membership
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Membership with className MembershipLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel             | SecondLevel           | ExpectedPage                                |
	| Dashboard              |                       | Membership_dashboard.aspx                   |
	| Chapters               |                       | LegacyBillingItem.aspx?ItemClassId=CHAPT    |
	| Renewals               | Generate renewals     | BillGeneration.aspx                         |
	| Renewals               | Issue notifications   | BillingIssueNotifications.aspx              |
	| Renewals               | Reverse open invoices | DuesReversals.aspx                          |
	| Manage expired members |                       | ManageExpiredMembers.aspx                   |
	| Automatic payments     | Dashboard             | AutoPay_Membership_Dashboard.aspx           |
	| Automatic payments     | Process payments      | Process_automatic_renewal_payments.aspx     |
	| Automatic payments     | Review payments       | Automatic_payment_history_for_renewals.aspx |
	| Automatic payments     | Enrollments           | Automatic_payment_instructions.aspx         |
	| Billing cycles         |                       | BillingCycle.aspx                           |
	| Billing products       |                       | LegacyBillingItem.aspx                      |
	| Prorating rules        |                       | Prorating_schedules.aspx                    |

Scenario Outline: I navigate to all staff menu items in Fundraising
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Fundraising with className FundraisingLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel           | SecondLevel               | ExpectedPage                                           |
	| Dashboard            |                           | Fundraising_Overview_Dashboard.aspx                    |
	| Enter gifts          |                           | DonationEntry.aspx                                     |
	| Gift requests        |                           | Gift_Requests.aspx                                     |
	| Find gifts           |                           | Find_gifts.aspx                                        |
	| Find gift items      |                           | Fund-List.aspx                                         |
	| Add gift item        |                           | Add_gift_item.aspx                                     |
	| Moves management     | Dashboard                 | OverallMovesManagement.aspx                            |
	| Moves management     | My major donors           | Landing_Page.aspx                                      |
	| Automatic payments   | Dashboard                 | Autopay_fundraising_dashboard.aspx                     |
	| Automatic payments   | Process payments          | Process_recurring_donation_payments.aspx               |
	| Automatic payments   | Review payments           | Automatic_payment_history_for_recurring_donations.aspx |
	| Automatic payments   | Enrollments               | Automatic_payment_instructions.aspx                    |
	| Receipting           | Issue receipts            | Issue-Receipts-CCO.aspx                                |
	| Receipting           | Find issued receipts      | Find-issued-receipts.aspx                              |
	| Receipting           | Receipt logs              | ReceiptLogDisplay.aspx                                 |
	| Tribute notification | Issue notifications       | Tribute_Notifications.aspx                             |
	| Tribute notification | Find issued notifications | Find_issued_notifications.aspx                         |
	| Reverse open pledges |                           | PledgeReversals.aspx                                   |
	| Import donations     |                           | Donation_importer.aspx                                 |
	| Premium sets         |                           | ConfigurePremiumsDisplay.aspx                          |
	| Adjustment logs      |                           | Gift-adjustment-logs.aspx                              |

Scenario Outline: I navigate to all staff menu items in Events
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Events with className EventsLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel                | SecondLevel | ExpectedPage                   |
	| Dashboard                 |             | Events_Dashboard.aspx          |
	| Find events               |             | Events_List.aspx               |
	| Find registrations        |             | Find-registrations.aspx        |
	| Add event                 |             | Event_Add.aspx                 |
	| Calendar                  |             | Events_Calendar.aspx           |
	| Issue event confirmations |             | Issue_event_confirmations.aspx |
	| Manage templates          |             | Manage_templates.aspx          |
	
Scenario Outline: I navigate to all staff menu items in Commerce
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Commerce with className CommerceLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel         | SecondLevel           | ExpectedPage                   |
	| Dashboard          |                       | Commerce_Dashboard.aspx        |
	| Find products      |                       | Store_Home.aspx                |
	| Add product        |                       | Add_Item.aspx                  |
	| Find order         |                       | Find_orders.aspx               |
	| Process orders     | Issue quotes          | Issue-quotes-page.aspx         |
	| Process orders     | Convert quotes        | Convert-quotes-page.aspx       |
	| Process orders     | Print shipping papers | Shipping-papers-page.aspx      |
	| Process orders     | Ship orders           | Ship-orders-page.aspx          |
	| Process orders     | Generate invoices     | Invoice-orders-page.aspx       |
	| Process orders     | Release backorders    | Manual-Release-Backorders.aspx |
	| Promotions         |                       | ManagePromotions.aspx          |
	| Inventory receipts |                       | InventoryReceipts.aspx         |

Scenario Outline: I navigate to all staff menu items in Advertising
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Advertising with className AdvertisingLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel   | SecondLevel                | ExpectedPage               |
	| Dashboard    |                            | Advertising/Dashboard.aspx |
	| Media orders |                            | Media-order.aspx           |
	| Settings     | Media assets               | Media-asset.aspx           |
	| Settings     | Representative - Territory | Sales-representatives.aspx |
	| Settings     | Mapping                    | Mapping.aspx               |
	| Settings     | Production settings        | Production-setup.aspx      |

Scenario Outline: I navigate to all staff menu items in Marketing
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Marketing with className MarketingLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel              | SecondLevel         | ExpectedPage                                            |
	| Communication dashboard |                     | Communication-Dashboard.aspx                            |
	| Advanced email          |                     | Advanced_Email_Dashboard.aspx                           |
	| Communication templates |                     | DocumentBrowser.aspx                                    |
	| Communication logs      |                     | Communication_Logs.aspx                                 |
	| Campaigns               | Track campaigns     | Template.aspx?ContentCode=CM.SolicitationsList          |
	| Campaigns               | Define campaigns    | Template.aspx?ContentCode=CM.CampaignList               |
	| Campaigns               | Define inserts      | Template.aspx?ContentCode=PM.SupplementList             |
	| Campaigns               | Record responses    | Template.aspx?ContentCode=CM.RecordResponse.ContactList |
	| Campaigns               | View output         | ObjectBrowser.aspx                                      |
	| Campaigns               | Import source codes | Source_code_importer.aspx                               |
	| Campaigns               | Settings            | Template.aspx?ContentCode=CM.Setup                      |
	| Segmentation            | Define segments     | Template.aspx?ContentCode=SM.JobList                    |
	| Segmentation            | Settings            | ContentCode=SM.Setup                                    |
	| RFM                     | Run analytics       | Default.aspx                                            |
	| RFM                     | Settings            | ContentCode=RFM.Setup                                   |
	| Process manager         | Projects            | Template.aspx?ContentCode=OM.OpportunityList            |
	| Process manager         | Tasks               | ContentCode=OM.AllOppTaskList                           |
	| Process manager         | Settings            | Setup.aspx                                              |

Scenario Outline: I navigate to all staff menu items in Certification
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Certification with className EducationLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel        | SecondLevel             | ExpectedPage                    |
	| Enrollments       | By program              | Enrollments_by_program.aspx     |
	| Enrollments       | By enrollee             | AnalyzeEnrolleeProgress.aspx    |
	| Enrollments       | Inactive enrollments    | PurgeInactiveRegistrations.aspx |
	| Pending approvals | Requirement completions | ReviewExperienceList.aspx       |
	| Pending approvals | Program completions     | ReviewProgramCompletions.aspx   |
	| Define programs   | Certification programs  | CertificationProgramList.aspx   |
	| Define programs   | Program components      | CertificationModuleList.aspx    |
	| Define programs   | Program groups          | ProgramGroupList.aspx           |
	| Define programs   | Unit types              | UomList.aspx                    |
	| Providers         |                         | ManageProviders.aspx            |

Scenario Outline: I navigate to all staff menu items in Finance
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Finance with className FinanceLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel         | SecondLevel                    | ExpectedPage              |
	| Dashboard          |                                | Finance_Dashboard.aspx    |
	| Invoices           |                                | Invoices.aspx             |
	| Pay Central        | Dashboard                      | Pay-Central.aspx          |
	| Pay Central        | Find payments                  | Payments.aspx             |
	| Pay Central        | Automatic payment transactions | Gateway-transactions.aspx |
	| Pay Central        | Pay Central Live               | PayCentralLive.aspx       |
	| Batches            |                                | Batches.aspx              |
	| Closing procedures | Credit invoices                | CreditInvoice.aspx        |
	| Closing procedures | Invoice write-offs             | MassWriteOffs.aspx        |
	| Closing procedures | General ledger export          | GLExport.aspx             |

Scenario Outline: I navigate to all staff menu items in Continuum
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Continuum with className ReportsLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel                   | SecondLevel | ExpectedPage                                                                                |
	| Guided Performance Scorecard |             | Guided_Performance_Scorecard.aspx                                                           |
	| All reports                  |             | ObjectBrowser.aspx                                                                          |
	| Contact reports              |             | ObjectBrowser.aspx?DocumentPath=%24%2fContactManagement%2fDefaultSystem%2fReports           |
	| Membership reports           |             | ObjectBrowser.aspx?DocumentPath=%24%2fMembership%2fDefaultSystem%2fReports                  |
	| Fundraising reports          |             | DocumentPath=%24%2fFundraising%2fDefaultSystem%2fReports                                    |
	| Event reports                |             | ObjectBrowser.aspx?DocumentPath=%24%2fEventManagement%2fDefaultSystem%2fReports             |
	| Commerce reports             |             | ObjectBrowser.aspx?DocumentPath=%24%2fOrderManagement%2fDefaultSystem%2fReports             |
	| Accounting reports           |             | DocumentPath=%24%2fAccounting%2fDefaultSystem%2fReports                                     |
	| Certification reports        |             | ObjectBrowser.aspx?DocumentPath=%24%2fCertificationManagement%2fDefaultSystem%2fReportsView |
	| Content reports              |             | ObjectBrowser.aspx?DocumentPath=%24%2fContentManagement%2fDefaultSystem%2fReports           |
	| Report Writer                |             | reportviewer.aspx                                                                           |

Scenario Outline: I navigate to all staff menu items in RiSE
	Given I am on the Staff site as designated user System Administrator
	When I navigate to RiSE with className RiSELink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel                  | SecondLevel              | ExpectedPage                                                                     |
	| Dashboard                   |                          | RiSEDashboard.aspx                                                               |
	| Site Builder                | Manage sitemaps          | PerspectiveList.aspx                                                             |
	| Site Builder                | Manage websites          | WebsiteList.aspx                                                                 |
	| Site Builder                | Manage shortcuts         | URLMapping.aspx                                                                  |
	| Page Builder                | Manage content           | ContentDesigner.aspx                                                             |
	| Page Builder                | Manage layouts           | ContentLayoutList.aspx                                                           |
	| Page Builder                | Manage files             | ObjectBrowser.aspx?DocumentPath=%24%2fCommon%2fUploaded                          |
	| Page Builder                | Task list                | TaskList.aspx                                                                    |
	| Theme Builder               | Website templates        | WebsiteTemplateList.aspx                                                         |
	| Theme Builder               | Website layouts          | WebsiteLayoutList.aspx                                                           |
	| Theme Builder               | Themes                   | ObjectBrowser.aspx?DocumentPath=%24%2fContentManagement%2fDefaultSystem%2fThemes |
	| Theme Builder               | Task list                | ThemeTaskList.aspx                                                               |
	| Tagging                     | Tags                     | TagTree.aspx                                                                     |
	| Tagging                     | Tagged list formats      | TaggedComponentTemplateList.aspx                                                 |
	| Maintenance                 | Publishing servers       | PublishServerList.aspx                                                           |
	| Maintenance                 | User defined fields      | UserDefinedFieldList.aspx                                                        |
	| Maintenance                 | Content types            | ContentTypeList.aspx                                                             |
	| Maintenance                 | Navigation areas         | Navigation-areas.aspx                                                            |
	| Maintenance                 | Content authority groups | AuthorityGroupList.aspx                                                          |
	| Style Guide                 | Base elements            | baseelements.aspx                                                                |
	| Style Guide                 | Forms                    | Forms.aspx                                                                       |
	| Style Guide                 | Icons                    | Icons.aspx                                                                       |
	| Style Guide                 | Utilities                | Utilities.aspx                                                                   |
	| Intelligent Query Architect |                          | IQA/Default.aspx                                                                 |
	| Business Object Designer    |                          | BOA/Default.aspx                                                                 |
	| Form Builder                | Form library             | Form-Library.aspx                                                                |
	| Form Builder                | Approvals queue          | FormApprovalsReview.aspx                                                         |
	| Form Builder                | Health check             | Form-Health-Check.aspx                                                           |
	| Form Builder                | Form groups              | Form-Groups.aspx                                                                 |
	| Form Builder                | Migrate forms            | Form-Migration.aspx                                                              |
	| Panel Designer              |                          | PanelDefinitionList.aspx                                                         |
	| Process automation          |                          | Process_automatio.aspx                                                           |
	| Scoring                     |                          | Engagement_score_formulas.aspx                                                   |
	| Document system             |                          | DocumentBrowser.aspx                                                             |
	| Workflow                    | Workflow viewer          | WorkflowManagerPortfolio.aspx                                                    |
	| Workflow                    | Workflow items           | Template.aspx?ContentCode=BSA.WorkflowDesigner.WorkItemConsole                   |
	| Workflow                    | Monitor processes        | Template.aspx?ContentCode=BSA.WorkflowDesigner.MonitorProcesses                  |
	| Task viewer                 |                          | TaskList.aspx                                                                    |

Scenario Outline: I navigate to all staff menu items in Settings
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Settings with className SetupLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage>
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel            | SecondLevel                | ExpectedPage                                             |
	| About iMIS            |                            | AboutImis.aspx                                           |
	| Organization          |                            | QuickSetup.aspx                                          |
	| Contacts              | General                    | SystemConfigPage.aspx?PageName=ContactsGeneral           |
	| Contacts              | Contact security           | ContactSecuritySettings.aspx                             |
	| Contacts              | Communication preferences  | Communication_Preferences_Settings.aspx                  |
	| Contacts              | Account management         | SystemConfigPage.aspx?PageName=AccountManagementRiSE     |
	| Contacts              | Authentication             | PasswordExpirationConfiguration.aspx                     |
	| Contacts              | Social media               | Authorization_Providers.aspx                             |
	| Contacts              | Client applications        | ClientApplication.aspx                                   |
	| Contacts              | Customer types             | CustomerType.aspx                                        |
	| Contacts              | Activity types             | ActivityType.aspx                                        |
	| Contacts              | Committee positions        | Committee_Positions.aspx                                 |
	| Contacts              | Committee minutes          | CommitteeMinutes.aspx                                    |
	| Contacts              | Relationship types         | RelationshipTypes.aspx                                   |
	| Contacts              | System options             | Customers/Setup.aspx                                     |
	| Addresses             | Address formats            | Address_Formats.aspx                                     |
	| Addresses             | States and provinces       | States-and-Provinces.aspx                                |
	| Addresses             | Countries                  | Countries.aspx                                           |
	| Communities           |                            | SystemConfigPage.aspx?PageName=CommunitySettings         |
	| Membership            |                            | BillingSetup.aspx                                        |
	| Fundraising           | General                    | Fundraising/Setup.aspx                                   |
	| Fundraising           | Gift Aid (UK)              | SystemConfigPage.aspx?PageName=GiftAidUK                 |
	| Fundraising           | Tribute types              | TributeType.aspx                                         |
	| Events                | General                    | Events/Setup.aspx                                        |
	| Events                | Resource types             | ResourceType.aspx                                        |
	| Commerce              | General                    | SystemConfigPage.aspx?PageName=CommerceGeneral           |
	| Commerce              | Order types                | OrderTypes.aspx                                          |
	| Commerce              | Product categories         | ProductCategories.aspx                                   |
	| Commerce              | Shipping                   | FreightRate.aspx                                         |
	| Commerce              | Zones                      | FreightZone.aspx                                         |
	| Commerce              | Set up warehouses          | ProductLocation.aspx                                     |
	| Commerce              | System options             | Commerce/Setup.aspx                                      |
	| Finance               | General                    | Accounting/Setup.aspx                                    |
	| Finance               | Financial entities         | FinancialEntities.aspx                                   |
	| Finance               | Due to/due from            | DueToDueFrom.aspx                                        |
	| Finance               | GL accounts                | General-ledger-accounts.aspx                             |
	| Finance               | Pay Central                | Pay-Central-settings.aspx                                |
	| Finance               | Tax categories             | TaxCategories.aspx                                       |
	| Finance               | Tax codes                  | TaxAuthority.aspx                                        |
	| Finance               | VAT exceptions             | VATExceptionRules.aspx                                   |
	| Finance               | Terms                      | Terms.aspx                                               |
	| Finance               | Aging                      | Aging.aspx                                               |
	| RiSE                  | Quick setup                | SystemConfigPage.aspx?PageName=ContentManager.QuickSetup |
	| RiSE                  | Email settings             | SystemConfigPage.aspx?PageName=SMTP.EmailSettings        |
	| RiSE                  | Page builder configuration | SystemConfigPage.aspx?PageName=ContentDesigner           |
	| RiSE                  | Search configuration       | SystemConfigPage.aspx?PageName=Search                    |
	| RiSE                  | Indexing                   | Indexing_Preferences.aspx                                |
	| RiSE                  | Process automation         | SystemConfigPage.aspx?PageName=ProcessAutomation         |
	| RiSE                  | Workflow configuration     | SystemConfigPage.aspx?PageName=ContentWorkflow           |
	| RiSE                  | Report formats             | SystemConfigPage.aspx?PageName=SSRSFormats               |
	| RiSE                  | Business Object Manager    | BOAManager.aspx                                          |
	| RiSE                  | Recent history             | SystemConfigPage.aspx?PageName=RecentHistory             |
	| Language translation  | General                    | SystemConfigPage.aspx?PageName=TranslationSettings       |
	| Language translation  | Translation cultures       | Cultures.aspx                                            |
	| General lookup tables |                            | General_Lookup_Tables.aspx                               |
	| Advanced email        |                            | Email_Provider_Configuration.aspx                        |
	| Change notifications  |                            | Template.aspx                                            |

Scenario Outline: I navigate to all staff menu items in Help
	Given I am on the Staff site as designated user System Administrator
	When I navigate to Help with className HelpLink side menu <FirstLevel>, <SecondLevel>
	Then I verify url contains <ExpectedPage> in new tab
	And Server Error is not presented on screen

	Examples: 
	| FirstLevel    | SecondLevel | ExpectedPage           |
	| Documentation |             | help.imis.com          |
	| Support       |             | support.imis.com       |
	| Learning Hub  |             | learninghub.advsol.com |
	| Marketplace   |             | imismarketplace.com    |