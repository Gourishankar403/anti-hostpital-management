import sqlite3

def fix_db():
    conn = sqlite3.connect('bhm_homs.db')
    c = conn.cursor()
    c.execute("UPDATE requests SET stage1_status = 'APPROVED' WHERE stage1_status = 'APPROVE'")
    c.execute("UPDATE requests SET stage1_status = 'REJECTED' WHERE stage1_status = 'REJECT'")
    c.execute("UPDATE requests SET stage2_status = 'APPROVED' WHERE stage2_status = 'APPROVE'")
    c.execute("UPDATE requests SET stage2_status = 'REJECTED' WHERE stage2_status = 'REJECT'")
    conn.commit()
    conn.close()
    print('Database cleaned!')

if __name__ == "__main__":
    fix_db()
