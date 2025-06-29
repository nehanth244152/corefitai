import React from 'react';
import { Shield, ArrowLeft, Mail, Eye, Lock, Database, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to CoreFit.ai
          </Link>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              How we protect and handle your personal information
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 sm:p-10">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Eye className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                Introduction
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Welcome to CoreFit.ai ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you use our AI-powered fitness tracking service.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mt-4">
                <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                  <strong>Your Privacy Matters:</strong> We only collect data necessary to provide you with personalized fitness insights and never sell your personal information to third parties.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Database className="h-6 w-6 mr-3 text-emerald-600 dark:text-emerald-400" />
                Information We Collect
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Account Information</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1">
                <li>Email address (for account creation and communication)</li>
                <li>Authentication data through Google OAuth (if you choose to sign in with Google)</li>
                <li>Account preferences and settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Profile Information</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1">
                <li>Age, weight, height, and gender (for personalized calorie calculations)</li>
                <li>Activity level (sedentary, lightly active, etc.)</li>
                <li>Fitness goals and preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Fitness & Nutrition Data</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1">
                <li>Meal descriptions and food photos you upload</li>
                <li>Workout activities, duration, and frequency</li>
                <li>Nutritional information (calories, protein, carbs, fats)</li>
                <li>Fitness goals and progress tracking</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Usage Information</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 mb-4 space-y-1">
                <li>App usage patterns and feature interactions</li>
                <li>Device information and browser type</li>
                <li>IP address and general location (country/region)</li>
                <li>Feedback and ratings you provide</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Globe className="h-6 w-6 mr-3 text-purple-600 dark:text-purple-400" />
                How We Use Your Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Core Services</h3>
                  <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
                    <li>• AI-powered nutrition analysis of your meals</li>
                    <li>• Personalized calorie burn calculations</li>
                    <li>• Weekly fitness and nutrition recommendations</li>
                    <li>• Goal tracking and progress monitoring</li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 p-6 rounded-xl">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">Service Improvement</h3>
                  <ul className="text-emerald-800 dark:text-emerald-200 text-sm space-y-2">
                    <li>• Improving AI accuracy and recommendations</li>
                    <li>• Analyzing usage patterns for feature development</li>
                    <li>• Providing customer support</li>
                    <li>• Ensuring platform security and preventing abuse</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* AI and Third-Party Services */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-3 text-orange-600 dark:text-orange-400" />
                AI Services & Third-Party Partners
              </h2>
              
              <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">Google AI (Gemini)</h3>
                <p className="text-orange-800 dark:text-orange-200 text-sm">
                  We use Google's Gemini AI to analyze your meal descriptions and photos for nutritional estimates. 
                  Your data is processed according to Google's AI usage policies and is not used to train their models without consent.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Supabase (Database & Authentication)</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm">
                  Your account data and fitness information are securely stored using Supabase, which provides enterprise-grade security 
                  and complies with industry-standard data protection practices.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Google OAuth (Optional Sign-In)</h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  If you choose to sign in with Google, we only access your email address and basic profile information. 
                  We never access your other Google services or data.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Lock className="h-6 w-6 mr-3 text-red-600 dark:text-red-400" />
                Data Security
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Encryption</h3>
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    All data is encrypted in transit (HTTPS) and at rest using industry-standard encryption protocols.
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Access Control</h3>
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    Your data is protected by row-level security policies, ensuring you can only access your own information.
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Regular Backups</h3>
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    Your data is regularly backed up to prevent loss and ensure service continuity.
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Monitoring</h3>
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    We continuously monitor for security threats and unauthorized access attempts.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Your Rights & Controls</h2>
              
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-6">
                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-4">You have the right to:</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-green-800 dark:text-green-200 text-sm">
                  <div>
                    <strong>Access:</strong> Request a copy of all personal data we hold about you
                  </div>
                  <div>
                    <strong>Rectify:</strong> Correct any inaccurate or incomplete personal data
                  </div>
                  <div>
                    <strong>Delete:</strong> Request deletion of your account and all associated data
                  </div>
                  <div>
                    <strong>Export:</strong> Download your data in a portable format
                  </div>
                  <div>
                    <strong>Restrict:</strong> Limit how we process your personal data
                  </div>
                  <div>
                    <strong>Object:</strong> Opt out of certain data processing activities
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/30 rounded-lg">
                  <p className="text-green-900 dark:text-green-100 text-sm font-medium">
                    To exercise these rights, contact us at the email provided below. We'll respond within 30 days.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Data Retention</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <ul className="text-gray-700 dark:text-gray-300 space-y-3">
                  <li><strong>Active accounts:</strong> We retain your data as long as your account is active</li>
                  <li><strong>Inactive accounts:</strong> Accounts inactive for 2+ years may be automatically deleted</li>
                  <li><strong>Legal requirements:</strong> Some data may be retained longer if required by law</li>
                  <li><strong>Account deletion:</strong> When you delete your account, all personal data is permanently removed within 30 days</li>
                </ul>
              </div>
            </section>

            {/* Cookies and Analytics */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Cookies & Analytics</h2>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
                <p className="text-yellow-800 dark:text-yellow-200 mb-4">
                  We use minimal tracking and do not use third-party analytics services. Essential cookies are used for:
                </p>
                <ul className="text-yellow-800 dark:text-yellow-200 space-y-2">
                  <li>• Authentication and session management</li>
                  <li>• Remembering your preferences (theme, settings)</li>
                  <li>• Ensuring platform security</li>
                </ul>
                <p className="text-yellow-800 dark:text-yellow-200 mt-4 text-sm">
                  You can clear these cookies through your browser settings, though this may affect app functionality.
                </p>
              </div>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Children's Privacy</h2>
              <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
                <p className="text-purple-800 dark:text-purple-200">
                  CoreFit.ai is not intended for children under 13 years of age. We do not knowingly collect personal information 
                  from children under 13. If you believe we have collected such information, please contact us immediately 
                  and we will delete it promptly.
                </p>
              </div>
            </section>

            {/* Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                We may update this privacy policy from time to time to reflect changes in our practices or legal requirements. 
                When we make changes, we will:
              </p>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                <li>Update the "Last updated" date at the top of this policy</li>
                <li>Notify you via email for significant changes</li>
                <li>Display a notice in the app for material changes</li>
              </ul>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Mail className="h-6 w-6 mr-3 text-blue-600 dark:text-blue-400" />
                Contact Us
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  If you have any questions about this privacy policy or our data practices, please contact us:
                </p>
                <div className="text-blue-800 dark:text-blue-200">
                  <p className="mb-2"><strong>Email:</strong> privacy@corefitai.site</p>
                  <p className="mb-2"><strong>Website:</strong> https://corefitai.site</p>
                  <p><strong>Response Time:</strong> We aim to respond within 48 hours</p>
                </div>
              </div>
            </section>

            {/* Final Note */}
            <section className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Thank you for trusting CoreFit.ai with your fitness journey. Your privacy and data security are our top priorities.
                </p>
                <div className="mt-4">
                  <Link 
                    to="/" 
                    className="inline-flex items-center bg-gradient-to-r from-blue-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-emerald-600 transition-all duration-200"
                  >
                    Return to CoreFit.ai
                  </Link>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;