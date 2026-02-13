# Module 8: Support & Complaints - Flutter Implementation Guide

## 📂 File Structure

Create these files in your Flutter project:

```
lib/
├── models/
│   ├── complaint.dart
│   └── support_ticket.dart
├── services/
│   ├── complaint_service.dart
│   └── support_service.dart
├── screens/
│   └── support/
│       ├── support_hub_screen.dart
│       ├── file_complaint_screen.dart
│       ├── my_complaints_screen.dart
│       ├── contact_support_screen.dart
│       ├── my_tickets_screen.dart
│       └── help_center_screen.dart
└── widgets/
    └── support/
        ├── complaint_card.dart
        ├── ticket_card.dart
        └── status_badge.dart
```

---

## 📦 Step 1: Create Models

### `lib/models/complaint.dart`

```dart
class Complaint {
  final int id;
  final String reason;
  final String status;
  final DateTime createdAt;
  final int songId;
  final String songTitle;
  final String artistName;

  Complaint({
    required this.id,
    required this.reason,
    required this.status,
    required this.createdAt,
    required this.songId,
    required this.songTitle,
    required this.artistName,
  });

  factory Complaint.fromJson(Map<String, dynamic> json) {
    return Complaint(
      id: json['id'],
      reason: json['reason'],
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
      songId: json['song_id'],
      songTitle: json['song_title'],
      artistName: json['artist_name'],
    );
  }
}
```

### `lib/models/support_ticket.dart`

```dart
class SupportTicket {
  final int id;
  final String subject;
  final String message;
  final String category;
  final String status;
  final String? adminReply;
  final DateTime createdAt;
  final DateTime updatedAt;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.message,
    required this.category,
    required this.status,
    this.adminReply,
    required this.createdAt,
    required this.updatedAt,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'],
      subject: json['subject'],
      message: json['message'],
      category: json['category'],
      status: json['status'],
      adminReply: json['admin_reply'],
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  bool get hasReply => adminReply != null && adminReply!.isNotEmpty;
}
```

---

## 🌐 Step 2: Create API Services

### `lib/services/complaint_service.dart`

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/complaint.dart';
import '../utils/auth_storage.dart'; // Your auth token storage

class ComplaintService {
  final String baseUrl = 'YOUR_API_URL'; // e.g., 'https://api.faithstream.com'

  Future<String?> _getToken() async {
    return await AuthStorage.getToken();
  }

  /// File a complaint about a song
  Future<void> fileComplaint({
    required int songId,
    required String reason,
  }) async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.post(
      Uri.parse('$baseUrl/complaints/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'song_id': songId,
        'reason': reason,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to file complaint: ${response.body}');
    }
  }

  /// Get user's complaints
  Future<List<Complaint>> getMyComplaints() async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.get(
      Uri.parse('$baseUrl/complaints/my'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Complaint.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load complaints');
    }
  }
}
```

### `lib/services/support_service.dart`

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/support_ticket.dart';
import '../utils/auth_storage.dart';

class SupportService {
  final String baseUrl = 'YOUR_API_URL';

  Future<String?> _getToken() async {
    return await AuthStorage.getToken();
  }

  /// Create a support ticket
  Future<SupportTicket> createTicket({
    required String subject,
    required String message,
    required String category,
  }) async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.post(
      Uri.parse('$baseUrl/support/'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'subject': subject,
        'message': message,
        'category': category,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return SupportTicket.fromJson(data['ticket']);
    } else {
      throw Exception('Failed to create ticket: ${response.body}');
    }
  }

  /// Get user's support tickets
  Future<List<SupportTicket>> getMyTickets() async {
    final token = await _getToken();
    if (token == null) throw Exception('Not authenticated');

    final response = await http.get(
      Uri.parse('$baseUrl/support/my'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => SupportTicket.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load tickets');
    }
  }
}
```

---

## 🎨 Step 3: Create Widgets

### `lib/widgets/support/status_badge.dart`

```dart
import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final String type; // 'complaint' or 'ticket'

  const StatusBadge({
    Key? key,
    required this.status,
    required this.type,
  }) : super(key: key);

  Color _getColor() {
    if (type == 'complaint') {
      switch (status) {
        case 'OPEN':
          return Colors.orange;
        case 'RESOLVED':
          return Colors.green;
        default:
          return Colors.grey;
      }
    } else {
      // ticket
      switch (status) {
        case 'OPEN':
          return Colors.orange;
        case 'IN_PROGRESS':
          return Colors.blue;
        case 'RESOLVED':
          return Colors.green;
        case 'CLOSED':
          return Colors.grey;
        default:
          return Colors.grey;
      }
    }
  }

  String _getLabel() {
    return status.replaceAll('_', ' ');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getColor().withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _getColor(), width: 1),
      ),
      child: Text(
        _getLabel(),
        style: TextStyle(
          color: _getColor(),
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
```

### `lib/widgets/support/complaint_card.dart`

```dart
import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../models/complaint.dart';
import 'status_badge.dart';

class ComplaintCard extends StatelessWidget {
  final Complaint complaint;
  final VoidCallback? onTap;

  const ComplaintCard({
    Key? key,
    required this.complaint,
    this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      complaint.songTitle,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  StatusBadge(
                    status: complaint.status,
                    type: 'complaint',
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'by ${complaint.artistName}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                complaint.reason,
                style: const TextStyle(fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              Text(
                timeago.format(complaint.createdAt),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### `lib/widgets/support/ticket_card.dart`

```dart
import 'package:flutter/material.dart';
import 'package:timeago/timeago.dart' as timeago;
import '../../models/support_ticket.dart';
import 'status_badge.dart';

class TicketCard extends StatelessWidget {
  final SupportTicket ticket;
  final VoidCallback? onTap;

  const TicketCard({
    Key? key,
    required this.ticket,
    this.onTap,
  }) : super(key: key);

  IconData _getCategoryIcon() {
    switch (ticket.category) {
      case 'ACCOUNT':
        return Icons.person;
      case 'PAYMENT':
        return Icons.payment;
      case 'TECHNICAL':
        return Icons.bug_report;
      case 'OTHER':
        return Icons.help;
      default:
        return Icons.support;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(_getCategoryIcon(), size: 20, color: Colors.grey[600]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      ticket.subject,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  StatusBadge(
                    status: ticket.status,
                    type: 'ticket',
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                ticket.message,
                style: const TextStyle(fontSize: 14),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              if (ticket.hasReply) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, 
                        color: Colors.green, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          ticket.adminReply!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: Colors.green,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 8),
              Text(
                timeago.format(ticket.createdAt),
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 📱 Step 4: Create Screens

### `lib/screens/support/support_hub_screen.dart`

```dart
import 'package:flutter/material.dart';

class SupportHubScreen extends StatelessWidget {
  const SupportHubScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Help & Support'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'How can we help you?',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          _buildMenuItem(
            context,
            icon: Icons.report_problem,
            title: 'Report a Problem',
            subtitle: 'Report songs or issues',
            color: Colors.red,
            onTap: () => Navigator.pushNamed(context, '/file-complaint'),
          ),
          const SizedBox(height: 12),
          _buildMenuItem(
            context,
            icon: Icons.list_alt,
            title: 'My Complaints',
            subtitle: 'View your reported issues',
            color: Colors.orange,
            onTap: () => Navigator.pushNamed(context, '/my-complaints'),
          ),
          const SizedBox(height: 12),
          _buildMenuItem(
            context,
            icon: Icons.chat_bubble_outline,
            title: 'Contact Support',
            subtitle: 'Get help from our team',
            color: Colors.blue,
            onTap: () => Navigator.pushNamed(context, '/contact-support'),
          ),
          const SizedBox(height: 12),
          _buildMenuItem(
            context,
            icon: Icons.confirmation_number,
            title: 'My Tickets',
            subtitle: 'View support conversations',
            color: Colors.purple,
            onTap: () => Navigator.pushNamed(context, '/my-tickets'),
          ),
          const SizedBox(height: 12),
          _buildMenuItem(
            context,
            icon: Icons.help_outline,
            title: 'Help Center',
            subtitle: 'FAQs and guides',
            color: Colors.green,
            onTap: () => Navigator.pushNamed(context, '/help-center'),
          ),
          const SizedBox(height: 12),
          _buildMenuItem(
            context,
            icon: Icons.star,
            title: 'Rate FaithStream',
            subtitle: 'Share your feedback',
            color: Colors.amber,
            onTap: () => _showRateDialog(context),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(subtitle),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  void _showRateDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Rate FaithStream'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enjoying FaithStream? 🎵'),
            const SizedBox(height: 16),
            const Text('Help us by rating the app!'),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                5,
                (index) => Icon(Icons.star, color: Colors.amber, size: 32),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Maybe Later'),
          ),
          ElevatedButton(
            onPressed: () {
              // Open app store
              Navigator.pop(context);
            },
            child: const Text('Rate Now'),
          ),
        ],
      ),
    );
  }
}
```

### `lib/screens/support/file_complaint_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../../services/complaint_service.dart';

class FileComplaintScreen extends StatefulWidget {
  final int? songId; // Pass song ID if reporting from song screen
  final String? songTitle;

  const FileComplaintScreen({
    Key? key,
    this.songId,
    this.songTitle,
  }) : super(key: key);

  @override
  State<FileComplaintScreen> createState() => _FileComplaintScreenState();
}

class _FileComplaintScreenState extends State<FileComplaintScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();
  final _complaintService = ComplaintService();
  
  String? _selectedReason;
  int? _selectedSongId;
  String? _selectedSongTitle;
  bool _isSubmitting = false;

  final List<Map<String, String>> _complaintTypes = [
    {
      'value': 'COPYRIGHT',
      'label': 'Copyright Infringement',
      'subtitle': 'This song copies my work',
    },
    {
      'value': 'INAPPROPRIATE',
      'label': 'Inappropriate Content',
      'subtitle': 'Offensive or explicit content',
    },
    {
      'value': 'WRONG_INFO',
      'label': 'Wrong Information',
      'subtitle': 'Incorrect song/artist details',
    },
    {
      'value': 'TECHNICAL',
      'label': 'Technical Issue',
      'subtitle': "Song won't play or errors",
    },
    {
      'value': 'OTHER',
      'label': 'Other',
      'subtitle': 'Something else',
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.songId != null) {
      _selectedSongId = widget.songId;
      _selectedSongTitle = widget.songTitle;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report a Problem'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              "What's the issue?",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ..._complaintTypes.map((type) => RadioListTile<String>(
                  value: type['value']!,
                  groupValue: _selectedReason,
                  title: Text(type['label']!),
                  subtitle: Text(type['subtitle']!),
                  onChanged: (value) {
                    setState(() => _selectedReason = value);
                  },
                )),
            const SizedBox(height: 24),
            const Text(
              'Which song?',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            if (_selectedSongId == null)
              ElevatedButton.icon(
                onPressed: _searchSong,
                icon: const Icon(Icons.search),
                label: const Text('Search for song...'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                ),
              )
            else
              Card(
                child: ListTile(
                  leading: const Icon(Icons.music_note),
                  title: Text(_selectedSongTitle ?? 'Unknown Song'),
                  subtitle: const Text('Tap to change'),
                  trailing: IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () {
                      setState(() {
                        _selectedSongId = null;
                        _selectedSongTitle = null;
                      });
                    },
                  ),
                  onTap: _searchSong,
                ),
              ),
            const SizedBox(height: 24),
            const Text(
              'Tell us more',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _reasonController,
              maxLines: 5,
              decoration: const InputDecoration(
                hintText: 'Describe the issue in detail...',
                border: OutlineInputBorder(),
                helperText: 'Minimum 20 characters',
              ),
              validator: (value) {
                if (value == null || value.trim().length < 20) {
                  return 'Please provide at least 20 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitComplaint,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: _isSubmitting
                  ? const CircularProgressIndicator()
                  : const Text('Submit Report'),
            ),
          ],
        ),
      ),
    );
  }

  void _searchSong() {
    // Navigate to song search screen
    // For now, just show a placeholder
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Search Song'),
        content: const Text('Song search will be implemented here'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitComplaint() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedReason == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select an issue type')),
      );
      return;
    }
    if (_selectedSongId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a song')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await _complaintService.fileComplaint(
        songId: _selectedSongId!,
        reason: '${_selectedReason}: ${_reasonController.text}',
      );

      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Complaint submitted successfully'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }
}
```

### `lib/screens/support/my_complaints_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../../models/complaint.dart';
import '../../services/complaint_service.dart';
import '../../widgets/support/complaint_card.dart';

class MyComplaintsScreen extends StatefulWidget {
  const MyComplaintsScreen({Key? key}) : super(key: key);

  @override
  State<MyComplaintsScreen> createState() => _MyComplaintsScreenState();
}

class _MyComplaintsScreenState extends State<MyComplaintsScreen> {
  final _complaintService = ComplaintService();
  List<Complaint>? _complaints;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadComplaints();
  }

  Future<void> _loadComplaints() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final complaints = await _complaintService.getMyComplaints();
      if (mounted) {
        setState(() {
          _complaints = complaints;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Complaints'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadComplaints,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadComplaints,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_complaints == null || _complaints!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No complaints filed',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              'Report issues when you find them',
              style: TextStyle(color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadComplaints,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(vertical: 8),
        itemCount: _complaints!.length,
        itemBuilder: (context, index) {
          final complaint = _complaints![index];
          return ComplaintCard(
            complaint: complaint,
            onTap: () => _showComplaintDetails(context, complaint),
          );
        },
      ),
    );
  }

  void _showComplaintDetails(BuildContext context, Complaint complaint) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.4,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              const Center(
                child: Icon(Icons.drag_handle, color: Colors.grey),
              ),
              const SizedBox(height: 8),
              Text(
                complaint.songTitle,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'by ${complaint.artistName}',
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 16),
              const Text(
                'Reason:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(complaint.reason),
              const SizedBox(height: 16),
              const Text(
                'Status:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(complaint.status),
              const SizedBox(height: 16),
              Text(
                'Filed on: ${complaint.createdAt.toString().split('.')[0]}',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### `lib/screens/support/contact_support_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../../services/support_service.dart';

class ContactSupportScreen extends StatefulWidget {
  const ContactSupportScreen({Key? key}) : super(key: key);

  @override
  State<ContactSupportScreen> createState() => _ContactSupportScreenState();
}

class _ContactSupportScreenState extends State<ContactSupportScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _messageController = TextEditingController();
  final _supportService = SupportService();
  
  String _category = 'TECHNICAL';
  bool _isSubmitting = false;

  final List<Map<String, String>> _categories = [
    {'value': 'ACCOUNT', 'label': 'Account Issues'},
    {'value': 'PAYMENT', 'label': 'Payment Problems'},
    {'value': 'TECHNICAL', 'label': 'Technical Issues'},
    {'value': 'OTHER', 'label': 'General Question'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact Support'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'What do you need help with?',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(
                labelText: 'Category',
                border: OutlineInputBorder(),
              ),
              items: _categories.map((cat) {
                return DropdownMenuItem(
                  value: cat['value'],
                  child: Text(cat['label']!),
                );
              }).toList(),
              onChanged: (value) {
                setState(() => _category = value!);
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _subjectController,
              decoration: const InputDecoration(
                labelText: 'Subject',
                hintText: 'Brief description of your issue',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().length < 5) {
                  return 'Subject must be at least 5 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _messageController,
              maxLines: 6,
              decoration: const InputDecoration(
                labelText: 'Message',
                hintText: 'Describe your issue in detail...',
                border: OutlineInputBorder(),
                helperText: 'Minimum 20 characters',
              ),
              validator: (value) {
                if (value == null || value.trim().length < 20) {
                  return 'Message must be at least 20 characters';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitTicket,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: _isSubmitting
                  ? const CircularProgressIndicator()
                  : const Text('Submit Ticket'),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: Colors.blue),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Response time: 24-48 hours',
                      style: TextStyle(color: Colors.blue[800]),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitTicket() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      await _supportService.createTicket(
        subject: _subjectController.text.trim(),
        message: _messageController.text.trim(),
        category: _category,
      );

      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('✅ Ticket submitted! We\'ll respond soon.'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  void dispose() {
    _subjectController.dispose();
    _messageController.dispose();
    super.dispose();
  }
}
```

### `lib/screens/support/my_tickets_screen.dart`

```dart
import 'package:flutter/material.dart';
import '../../models/support_ticket.dart';
import '../../services/support_service.dart';
import '../../widgets/support/ticket_card.dart';

class MyTicketsScreen extends StatefulWidget {
  const MyTicketsScreen({Key? key}) : super(key: key);

  @override
  State<MyTicketsScreen> createState() => _MyTicketsScreenState();
}

class _MyTicketsScreenState extends State<MyTicketsScreen> {
  final _supportService = SupportService();
  List<SupportTicket>? _tickets;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTickets();
  }

  Future<void> _loadTickets() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final tickets = await _supportService.getMyTickets();
      if (mounted) {
        setState(() {
          _tickets = tickets;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Support Tickets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTickets,
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, '/contact-support'),
        icon: const Icon(Icons.add),
        label: const Text('New Ticket'),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadTickets,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_tickets == null || _tickets!.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.support_agent, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No support tickets',
              style: TextStyle(fontSize: 18, color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              'Create a ticket if you need help',
              style: TextStyle(color: Colors.grey[500]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.pushNamed(context, '/contact-support'),
              icon: const Icon(Icons.add),
              label: const Text('Create Ticket'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadTickets,
      child: ListView.builder(
        padding: const EdgeInsets.only(bottom: 80, top: 8),
        itemCount: _tickets!.length,
        itemBuilder: (context, index) {
          final ticket = _tickets![index];
          return TicketCard(
            ticket: ticket,
            onTap: () => _showTicketDetails(context, ticket),
          );
        },
      ),
    );
  }

  void _showTicketDetails(BuildContext context, SupportTicket ticket) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: ListView(
            controller: scrollController,
            children: [
              const Center(
                child: Icon(Icons.drag_handle, color: Colors.grey),
              ),
              const SizedBox(height: 8),
              Text(
                'Ticket #${ticket.id}',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
              const SizedBox(height: 4),
              Text(
                ticket.subject,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Your Message:',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.grey[700],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(ticket.message),
                  ],
                ),
              ),
              if (ticket.hasReply) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.green, width: 1),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.support_agent, 
                            color: Colors.green, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Support Team Reply:',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(ticket.adminReply!),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Category: ${ticket.category}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  Text(
                    'Status: ${ticket.status}',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Created: ${ticket.createdAt.toString().split('.')[0]}',
                style: TextStyle(fontSize: 12, color: Colors.grey[500]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 🔗 Step 5: Update Navigation

Add these routes to your app's router (e.g., in `main.dart` or route config):

```dart
routes: {
  '/support-hub': (context) => const SupportHubScreen(),
  '/file-complaint': (context) => const FileComplaintScreen(),
  '/my-complaints': (context) => const MyComplaintsScreen(),
  '/contact-support': (context) => const ContactSupportScreen(),
  '/my-tickets': (context) => const MyTicketsScreen(),
  '/help-center': (context) => const HelpCenterScreen(),
}
```

---

## 📦 Step 6: Required Packages

Add to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  timeago: ^3.5.0
  flutter_secure_storage: ^9.0.0  # For token storage
```

---

## ✅ Testing Checklist

1. **Test Complaint Flow**:
   - File a complaint
   - View complaint list
   - Check status updates

2. **Test Support Flow**:
   - Create support ticket
   - View tickets list
   - Check admin replies

3. **Test Navigation**:
   - Support hub navigation
   - Screen transitions
   - Back navigation

4. **Test Error Handling**:
   - No internet
   - Invalid token
   - Server errors

---

## 🎯 Quick Start Steps

1. **Create the folder structure**
2. **Copy models** (`complaint.dart`, `support_ticket.dart`)
3. **Copy services** (`complaint_service.dart`, `support_service.dart`)
4. **Copy widgets** (cards, badges)
5. **Copy screens** (6 screens)
6. **Update routes** in your app
7. **Add navigation** from Profile screen to Support Hub
8. **Test!**

---

## 🚀 Estimated Time

- **Models & Services**: 1 hour
- **Widgets**: 2 hours
- **Screens**: 4-6 hours
- **Testing & Polish**: 2 hours

**Total**: 1-2 days for complete Module 8

---

## 📱 Next Steps

After implementing:
1. Test all flows end-to-end
2. Add loading states and error handling
3. Implement search song feature in complaint screen
4. Add Help Center FAQ content
5. Test on both iOS and Android

You're ready to start coding! 🎵
